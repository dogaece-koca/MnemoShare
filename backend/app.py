from flask import Flask, request, jsonify, send_from_directory # send_from_directory eklendi
from generate import generate_mnemonic
from split import split_secret
from recover import recover_secret
from bip39_validator import is_valid_mnemonic
import qrcode
from io import BytesIO
import base64
from stegano import lsb  # En üste ekle
from PIL import Image    # Zaten yüklü olması lazım, yoksa ekle
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# --- FRONTEND (Kullanıcı Arayüzü) ROTASI ---
# Bu rotalar, tarayıcının arayüz dosyalarını yüklemesini sağlar.

@app.route("/")
def serve_index():
    """Ana dizin isteğinde (/) frontend/index.html dosyasını sunar."""
    # app.py (backend/) konumundan frontend/ klasöründeki index.html'e ulaşır.
    return send_from_directory('../frontend', 'index.html')
    
@app.route("/<path:filename>")
def serve_static(filename):
    """CSS ve JS gibi statik dosyaları frontend klasöründen sunar."""
    # index.html'deki <link href="style.css"> gibi istekler buraya düşer.
    # Bu, Flask'ın varsayılan 'static' klasörünü kullanmadan frontend klasörünü statik olarak sunmasını sağlar.
    return send_from_directory('../frontend', filename)


# --- API ROTASI: GENERATE (Oluşturma) ---

@app.post("/generate")
def api_generate():
    data = request.get_json(silent=True) or {}
    strength = int(data.get("strength", 128))

    phrase = generate_mnemonic(strength)
    return jsonify({"mnemonic": phrase})


# --- API ROTASI: SPLIT (Bölme) ---

@app.post("/split")
def api_split():
    try:
        data = request.get_json(force=True)

        # Gelen veriyi zorla str() olarak alıyoruz, bu en önemli düzeltme.
        secret = str(data.get("secret")) 
        t = int(data.get("t"))
        n = int(data.get("n"))

    except Exception as e:
        return jsonify({"error": "Giriş verisi hatası (JSON veya t/n değeri geçersiz): " + str(e)}), 400

    if not secret:
        return jsonify({"error": "Secret (Anahtar) alanı gereklidir."}), 400

    # BIP-39 Kontrolü (Secret str olduğu için artık güvenli)
    if len(secret.split()) >= 12 and not is_valid_mnemonic(secret):
        return jsonify({"error": "Invalid BIP-39 mnemonic (Geçersiz BIP-39 Anahtarı)"}), 400

    try:
        shares = split_secret(secret, t, n)
    except Exception as e:
        # Hata mesajını daha anlaşılır hale getiriyoruz
        return jsonify({"error": "Pay oluşturulamadı: " + str(e)}), 400

    return jsonify({"shares": shares})


# --- API ROTASI: RECOVER (Kurtarma) ---

@app.post("/recover")
def api_recover():
    data = request.get_json(force=True)

    shares = data.get("shares")
    if not isinstance(shares, list):
        return jsonify({"error": "shares must be a list"}), 400

    try:
        secret = recover_secret(shares)
    except Exception as e:
        return jsonify({"error": "Failed to recover secret: " + str(e)}), 400

    # Kurtarılan sırrın bir mnemonic olup olmadığını kontrol et
    if len(secret.split()) >= 12 and not is_valid_mnemonic(secret):
        return jsonify({"error": "Recovered secret failed BIP-39 validation"}), 400

    return jsonify({"secret": secret})


# --- API ROTASI: QR KOD OLUŞTURMA ---

@app.route('/generate-qr', methods=['POST'])
def generate_qr():
    """
    Gelen metni (Share) QR Kod resmine çevirir ve Base64 string olarak döner.
    Dosya kaydetme işlemi yapmaz (RAM üzerinde çalışır), bu sayede sunucuda çöp birikmez.
    """
    try:
        data = request.json.get('text', '')
        if not data:
            return jsonify({"error": "No text provided"}), 400

        # QR Kodu Oluştur
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,  # Düşük hata düzeltme (Daha az karmaşık desen)
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Resmi belleğe (RAM) kaydet
        buffered = BytesIO()
        img.save(buffered, format="PNG")

        # Base64 formatına çevir (Frontend'de <img src="data:image..."> olarak göstermek için)
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({"qr_image": img_str})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- API ROTASI: STEGANOGRAFİ (RESİM İÇİNE GİZLEME) ---

@app.route('/hide-in-image', methods=['POST'])
def hide_in_image():
    """
    Gönderilen resmin içine metni (Share) gizler.
    LSB (Least Significant Bit) algoritması kullanılır.
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Resim yüklenmedi"}), 400

        file = request.files['image']
        secret_text = request.form.get('secret_text', '')

        if not secret_text:
            return jsonify({"error": "Gizlenecek metin yok"}), 400

        # Resmi PIL ile aç
        image = Image.open(file)

        # Steganografi işlemi (Metni resme göm)
        secret_image = lsb.hide(image, secret_text)

        # Sonucu belleğe kaydet (Diske yazmadan)
        buffered = BytesIO()
        secret_image.save(buffered, format="PNG")

        # Base64'e çevir
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({"stego_image": img_str})

    except Exception as e:
        return jsonify({"error": f"Steganografi hatası: {str(e)}"}), 500


@app.route('/reveal-from-image', methods=['POST'])
def reveal_from_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Resim yüklenmedi"}), 400

        file = request.files['image']
        image = Image.open(file)

        # Gizli metni çıkar
        secret_text = lsb.reveal(image)

        if not secret_text:
            return jsonify({"error": "Bu resimde gizli veri bulunamadı."}), 404

        return jsonify({"secret_text": secret_text})

    except Exception as e:
        return jsonify({"error": f"Okuma hatası: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)