from flask import Flask, request, jsonify, send_from_directory
from generate import generate_mnemonic
from split import split_secret
from recover import recover_secret
from bip39_validator import is_valid_mnemonic
import qrcode
from io import BytesIO
import base64
from stegano import lsb
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def serve_index():
    return send_from_directory('../frontend', 'index.html')


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory('../frontend', filename)


@app.post("/generate")
def api_generate():
    data = request.get_json(silent=True) or {}
    strength = int(data.get("strength", 128))

    phrase = generate_mnemonic(strength)
    return jsonify({"mnemonic": phrase})


@app.post("/split")
def api_split():
    try:
        data = request.get_json(force=True)
        secret = str(data.get("secret"))
        t = int(data.get("t"))
        n = int(data.get("n"))

    except Exception as e:
        return jsonify({"error": "Input data error (JSON or invalid t/n value): " + str(e)}), 400

    if not secret:
        return jsonify({"error": "Secret field is required."}), 400

    # BIP-39 Check
    if len(secret.split()) >= 12 and not is_valid_mnemonic(secret):
        return jsonify({"error": "Invalid BIP-39 mnemonic"}), 400

    try:
        shares = split_secret(secret, t, n)
    except Exception as e:
        return jsonify({"error": "Failed to create shares: " + str(e)}), 400

    return jsonify({"shares": shares})


@app.post("/recover")
def api_recover():
    data = request.get_json(force=True)

    shares = data.get("shares")
    if not isinstance(shares, list):
        return jsonify({"error": "Shares must be a list"}), 400

    try:
        secret = recover_secret(shares)
    except Exception as e:
        return jsonify({"error": "Failed to recover secret: " + str(e)}), 400

    # Check if the recovered secret is a valid mnemonic
    if len(secret.split()) >= 12 and not is_valid_mnemonic(secret):
        return jsonify({"error": "Recovered secret failed BIP-39 validation"}), 400

    return jsonify({"secret": secret})


@app.route('/generate-qr', methods=['POST'])
def generate_qr():
    try:
        data = request.json.get('text', '')
        if not data:
            return jsonify({"error": "No text provided"}), 400

        # Create QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffered = BytesIO()
        img.save(buffered, format="PNG")

        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({"qr_image": img_str})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hide-in-image', methods=['POST'])
def hide_in_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files['image']
        secret_text = request.form.get('secret_text', '')

        if not secret_text:
            return jsonify({"error": "No text provided to hide"}), 400
        image = Image.open(file)

        secret_image = lsb.hide(image, secret_text)

        buffered = BytesIO()
        secret_image.save(buffered, format="PNG")

        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({"stego_image": img_str})

    except Exception as e:
        return jsonify({"error": f"Steganography error: {str(e)}"}), 500


@app.route('/reveal-from-image', methods=['POST'])
def reveal_from_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files['image']
        image = Image.open(file)

        secret_text = lsb.reveal(image)

        if not secret_text:
            return jsonify({"error": "No hidden data found in this image."}), 404

        return jsonify({"secret_text": secret_text})

    except Exception as e:
        return jsonify({"error": f"Reading error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)