// --- TOAST Bildirim Sistemi ---
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 4000);
}

// --- Panoya Kopyalama ---
function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value || element.innerText;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Panoya kopyalandı!', 'success');
    }).catch(err => {
        showToast('Kopyalama başarısız', 'error');
    });
}

// --- Sekme Yönetimi ---
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const targetTabId = button.getAttribute('data-tab');

        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(targetTabId).classList.add('active');
    });
});

// --- API İŞLEMLERİ ---

// 1. GENERATE (OLUŞTUR)
const generateForm = document.getElementById('generate-form');
if (generateForm) {
    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const strength = document.getElementById('strength').value;
        const resultArea = document.getElementById('generate-result-area');
        const mnemonicText = document.getElementById('generated-mnemonic');

        resultArea.classList.remove('hidden');
        mnemonicText.textContent = 'Oluşturuluyor...';

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strength: parseInt(strength) })
            });
            const data = await response.json();

            if (response.ok) {
                mnemonicText.textContent = data.mnemonic;
                showToast('Yeni anahtar oluşturuldu', 'success');
            } else {
                mnemonicText.textContent = 'Hata';
                showToast(data.error || 'Hata oluştu', 'error');
            }
        } catch (error) {
            showToast('Sunucu bağlantı hatası', 'error');
        }
    });
}

// 2. SPLIT (NORMAL BÖLME - Form ile)
const splitForm = document.getElementById('split-form');
if (splitForm) {
    splitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const secret = document.getElementById('secret-input').value.trim();
        const t = parseInt(document.getElementById('threshold-input').value);
        const n = parseInt(document.getElementById('shares-input').value);
        const resultArea = document.getElementById('split-result-area');

        if (!secret) {
            showToast('Lütfen bir anahtar girin', 'error');
            return;
        }

        resultArea.classList.remove('hidden');

        try {
            const response = await fetch('/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret, t, n })
            });
            const data = await response.json();

            if (response.ok) {
                const sharesOutput = document.getElementById('shares-output');
                const qrGrid = document.getElementById('qr-grid');

                sharesOutput.value = data.shares.join('\n');
                qrGrid.innerHTML = ''; // Temizle

                showToast('Parçalar oluşturuldu.', 'success');

                // QR Kodları Oluştur (Frontend tarafında)
                data.shares.forEach((share, index) => {
                     const card = document.createElement('div');
                     card.style.cssText = "background: #fff; padding: 10px; border-radius: 8px; text-align: center; color: black; display:inline-block; margin:5px;";

                     const title = document.createElement('strong');
                     title.innerText = `Parça #${index + 1}`;
                     title.style.display = 'block';
                     card.appendChild(title);

                     const qrDiv = document.createElement('div');
                     new QRCode(qrDiv, {
                        text: share,
                        width: 128,
                        height: 128
                     });
                     card.appendChild(qrDiv);
                     qrGrid.appendChild(card);
                });

            } else {
                showToast(data.error || 'İşlem Başarısız', 'error');
            }
        } catch (error) {
            showToast('Sunucu bağlantı hatası', 'error');
        }
    });
}

// 3. RECOVER (KURTAR)
const recoverForm = document.getElementById('recover-form');
if (recoverForm) {
    recoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sharesInput = document.getElementById('shares-list').value;
        const shares = sharesInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        const resultArea = document.getElementById('recover-result-area');
        const secretText = document.getElementById('recovered-secret');

        if (shares.length < 2) {
            showToast('En az 2 pay girmelisiniz', 'error');
            return;
        }

        resultArea.classList.remove('hidden');
        secretText.textContent = 'Çözülüyor...';

        try {
            const response = await fetch('/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shares })
            });
            const data = await response.json();

            if (response.ok) {
                secretText.textContent = data.secret;
                showToast('Anahtar başarıyla kurtarıldı!', 'success');
            } else {
                secretText.textContent = 'Kurtarılamadı.';
                showToast(data.error, 'error');
            }
        } catch (error) {
            showToast('Sunucu bağlantı hatası', 'error');
        }
    });
}

// --- STEGANOGRAFİ İŞLEMLERİ ---
const btnHideStego = document.getElementById('btn-hide-stego');
if (btnHideStego) {
    btnHideStego.addEventListener('click', async () => {
        const text = document.getElementById('stego-input-text').value;
        const fileInput = document.getElementById('stego-upload-file');
        const resultDiv = document.getElementById('stego-result');
        const resultImg = document.getElementById('stego-output-img');

        if (!text || fileInput.files.length === 0) {
            showToast('Lütfen metin girin ve bir resim seçin.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('secret_text', text);

        showToast('Resim işleniyor...', 'info');

        try {
            const response = await fetch('/hide-in-image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                resultImg.src = `data:image/png;base64,${data.stego_image}`;
                resultDiv.classList.remove('hidden');
                showToast('Başarılı! Metin resme gizlendi.', 'success');
            } else {
                showToast('Hata: ' + data.error, 'error');
            }
        } catch (err) {
            showToast('İşlem hatası', 'error');
        }
    });
}

const btnRevealStego = document.getElementById('btn-reveal-stego');
if (btnRevealStego) {
    btnRevealStego.addEventListener('click', async () => {
        const fileInput = document.getElementById('recover-stego-file');
        const textArea = document.getElementById('shares-list');

        if (fileInput.files.length === 0) {
            showToast('Lütfen gizli verili bir resim seçin.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        showToast('Resim taranıyor...', 'info');

        try {
            const response = await fetch('/reveal-from-image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                const currentVal = textArea.value;
                textArea.value = currentVal ? currentVal + '\n' + data.secret_text : data.secret_text;
                showToast('Gizli veri bulundu ve listeye eklendi!', 'success');
            } else {
                showToast('Hata: ' + (data.error || 'Veri bulunamadı'), 'error');
            }
        } catch (err) {
            showToast('Okuma hatası', 'error');
        }
    });
}

// --- METAMASK SNAP BAĞLANTISI (DÜZELTİLMİŞ HALİ) ---
const snapId = 'local:http://localhost:8080';
const connectSnapBtn = document.getElementById('connect-snap');

// Eğer buton sayfada varsa tıklama olayını ekle
if (connectSnapBtn) {
    connectSnapBtn.addEventListener('click', connectAndSplit);
}

async function connectAndSplit(e) {
    e.preventDefault();

    if (!window.ethereum) {
        showToast('MetaMask yüklü değil!', 'error');
        return;
    }

    try {
        // 1. Snap Bağlantısı
        await window.ethereum.request({
            method: 'wallet_requestSnaps',
            params: { [snapId]: {} }
        });

        // 2. Snap'i Çalıştır
        const result = await window.ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
                snapId: snapId,
                request: { method: 'split_secret' }
            }
        });

        if (result && result.shares) {
            // A) Ana Metin Kutusu
            const sharesTextArea = document.getElementById('shares-output');
            const resultArea = document.getElementById('split-result-area');

            resultArea.classList.remove('hidden');
            sharesTextArea.value = result.shares.join('\n');

            // B) QR Alanı (Düzeltilmiş Format)
            const qrGrid = document.getElementById('qr-grid');
            qrGrid.innerHTML = "";

            // Grid Container Ayarı (Yan yana ve boşluklu dizilmesi için)
            qrGrid.style.cssText = "display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;";

            result.shares.forEach((share, index) => {
                // KART TASARIMI
                const card = document.createElement('div');
                card.style.cssText = `
                    background: #fff; 
                    width: 220px; 
                    padding: 15px; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: #333;
                `;

                // Başlık
                const title = document.createElement('strong');
                title.innerText = `Parça #${index + 1}`;
                title.style.marginBottom = "10px";
                title.style.fontSize = "1.1em";
                title.style.color = "#d35400"; // Turuncu vurgu
                card.appendChild(title);

                // QR Kod
                const qrDiv = document.createElement('div');
                new QRCode(qrDiv, {
                    text: share,
                    width: 150, // QR boyutu
                    height: 150,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.M
                });
                // QR'a biraz boşluk verelim
                qrDiv.style.marginBottom = "15px";
                card.appendChild(qrDiv);

                // Metin Alanı (Scroll Özellikli)
                const textVal = document.createElement('div');
                textVal.innerText = share;
                textVal.style.cssText = `
                    font-size: 11px;
                    background: #f1f2f6;
                    padding: 8px;
                    border-radius: 6px;
                    border: 1px solid #dfe4ea;
                    width: 100%;
                    word-break: break-all;
                    max-height: 80px;      /* Maksimum yükseklik */
                    overflow-y: auto;      /* Taşarsa scroll çıkar */
                    text-align: left;
                    font-family: monospace;
                `;
                card.appendChild(textVal);

                // Kopyala Butonu (Küçük)
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Kopyala';
                copyBtn.style.cssText = `
                    margin-top: 10px;
                    background: #2c3e50;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8em;
                    width: 100%;
                `;
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(share);
                    showToast(`Parça #${index+1} kopyalandı!`, 'success');
                };
                card.appendChild(copyBtn);

                qrGrid.appendChild(card);
            });

            showToast("Formatlanmış parçalar hazır! ✨", 'success');
        }

    } catch (err) {
        console.error(err);
        showToast("Hata: " + (err.message || err), 'error');
    }
}