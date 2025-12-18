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
    const text = document.getElementById(elementId).innerText || document.getElementById(elementId).value;
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
document.getElementById('generate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const strength = document.getElementById('strength').value;
    const resultArea = document.getElementById('generate-result-area');
    const mnemonicText = document.getElementById('generated-mnemonic');

    resultArea.classList.remove('hidden');
    mnemonicText.textContent = 'Oluşturuluyor...';

    try {
        const response = await fetch('http://127.0.0.1:5000/generate', {
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

// 2. SPLIT (BÖL)
document.getElementById('split-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const secret = document.getElementById('secret-input').value.trim();
    const t = parseInt(document.getElementById('threshold-input').value);
    const n = parseInt(document.getElementById('shares-input').value);
    const resultArea = document.getElementById('split-result-area');

    // Eşik değerini bilgi kutusuna yaz (HTML'de bu ID varsa)
    const displayT = document.getElementById('display-t');
    if(displayT) displayT.textContent = t;

    if (!secret) {
        showToast('Lütfen bir anahtar girin', 'error');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/split', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, t, n })
        });
        const data = await response.json();

        if (response.ok) {
            const sharesOutput = document.getElementById('shares-output');
            const qrGrid = document.getElementById('qr-grid');

            resultArea.classList.remove('hidden');
            sharesOutput.value = data.shares.join('\n');

            qrGrid.innerHTML = '';
            showToast('Parçalar oluşturuldu, QR kodlar hazırlanıyor...', 'info');

            // QR Kodları Tek Tek Çek
            data.shares.forEach(async (share, index) => {
                try {
                    const qrReq = await fetch('http://127.0.0.1:5000/generate-qr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: share })
                    });
                    const qrRes = await qrReq.json();

                    if (qrRes.qr_image) {
                        const card = document.createElement('div');
                        card.style.cssText = "background: #fff; padding: 10px; border-radius: 8px; text-align: center; color: black;";

                        card.innerHTML = `
                            <strong style="display:block; margin-bottom:5px;">Parça #${index + 1}</strong>
                            <img src="data:image/png;base64,${qrRes.qr_image}" style="width: 100%; height: auto; display: block;">
                            <a href="data:image/png;base64,${qrRes.qr_image}" download="Share_${index + 1}.png" 
                               style="display:block; margin-top:5px; font-size:0.8em; color:#333; text-decoration:none; border:1px solid #ccc; padding:2px;">
                               <i class="fa-solid fa-download"></i> İndir
                            </a>
                        `;
                        qrGrid.appendChild(card);
                    }
                } catch (err) {
                    console.error("QR Hatası:", err);
                }
            });
            showToast('Başarılı! Parçalar ve QR kodlar hazır.', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Sunucu bağlantı hatası', 'error');
    }
});

// 3. RECOVER (KURTAR)
document.getElementById('recover-form').addEventListener('submit', async (e) => {
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
        const response = await fetch('http://127.0.0.1:5000/recover', {
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
}); // <-- RECOVER BURADA BİTTİ. DİĞERLERİ DIŞARIDA OLMALI.

// --- STEGANOGRAFİ: GİZLEME (HIDE) ---
document.getElementById('btn-hide-stego').addEventListener('click', async () => {
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
        const response = await fetch('http://127.0.0.1:5000/hide-in-image', {
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

// --- STEGANOGRAFİ: OKUMA (REVEAL) ---
document.getElementById('btn-reveal-stego').addEventListener('click', async () => {
    const fileInput = document.getElementById('recover-stego-file');
    const textArea = document.getElementById('shares-list'); // Mevcut textarea'ya yazacağız

    if (fileInput.files.length === 0) {
        showToast('Lütfen gizli verili bir resim seçin.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    showToast('Resim taranıyor...', 'info');

    try {
        const response = await fetch('http://127.0.0.1:5000/reveal-from-image', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            // Var olan metne ekle (Yeni satır olarak)
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