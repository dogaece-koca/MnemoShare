// --- TOAST Notification System ---
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 4000);
}

// --- Copy to Clipboard ---
function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value || element.innerText;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        showToast('Copy failed', 'error');
    });
}

// --- Tab Management ---
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const targetTabId = button.getAttribute('data-tab');

        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(targetTabId).classList.add('active');
    });
});

// --- API OPERATIONS ---

// 1. GENERATE
document.getElementById('generate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const strength = document.getElementById('strength').value;
    const resultArea = document.getElementById('generate-result-area');
    const mnemonicText = document.getElementById('generated-mnemonic');

    resultArea.classList.remove('hidden');
    mnemonicText.textContent = 'Generating...';

    try {
        const response = await fetch('http://127.0.0.1:5000/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strength: parseInt(strength) })
        });
        const data = await response.json();

        if (response.ok) {
            mnemonicText.textContent = data.mnemonic;
            showToast('New key generated', 'success');
        } else {
            mnemonicText.textContent = 'Error';
            showToast(data.error || 'An error occurred', 'error');
        }
    } catch (error) {
        showToast('Server connection error', 'error');
    }
});

// 2. SPLIT (GÜNCELLENDİ: Metin ve Kopyalama Butonu Eklendi)
document.getElementById('split-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const secret = document.getElementById('secret-input').value.trim();
    const t = parseInt(document.getElementById('threshold-input').value);
    const n = parseInt(document.getElementById('shares-input').value);
    const resultArea = document.getElementById('split-result-area');

    if (!secret) {
        showToast('Please enter a key', 'error');
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
            // Grid düzeni (Web versiyonu ile aynı stil)
            qrGrid.style.cssText = "display: flex; flex-direction: column; gap: 15px; align-items: center; margin-top: 15px;";

            showToast('Shares created, preparing QR codes...', 'info');

            // Fetch QR Codes Individually
            for (let index = 0; index < data.shares.length; index++) {
                const share = data.shares[index];

                try {
                    const qrReq = await fetch('http://127.0.0.1:5000/generate-qr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: share })
                    });
                    const qrRes = await qrReq.json();

                    if (qrRes.qr_image) {
                        // KART OLUŞTURMA (DOM Element Yöntemiyle - CSP Uyumlu)
                        const card = document.createElement('div');
                        card.style.cssText = `
                            background: #fff; 
                            width: 100%; 
                            padding: 15px; 
                            border-radius: 8px; 
                            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            color: #333;
                            box-sizing: border-box;
                        `;

                        // Başlık
                        const title = document.createElement('strong');
                        title.innerText = `Share #${index + 1}`;
                        title.style.cssText = "display:block; margin-bottom:10px; color:#d35400; font-size:1.1em;";
                        card.appendChild(title);

                        // Resim
                        const img = document.createElement('img');
                        img.src = `data:image/png;base64,${qrRes.qr_image}`;
                        img.style.cssText = "width: 150px; height: 150px; display: block; margin-bottom: 10px;";
                        card.appendChild(img);

                        // Metin Alanı (Scroll özellikli)
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
                            max-height: 60px;      
                            overflow-y: auto;      
                            text-align: left;
                            font-family: monospace;
                            margin-bottom: 8px;
                            color: #333;
                        `;
                        card.appendChild(textVal);

                        // Buton Grubu
                        const btnGroup = document.createElement('div');
                        btnGroup.style.cssText = "display: flex; gap: 10px; width: 100%;";

                        // Kopyala Butonu
                        const copyBtn = document.createElement('button');
                        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                        copyBtn.className = "btn"; // Genel btn stili
                        copyBtn.style.cssText = `
                            flex: 1;
                            background: #2c3e50;
                            color: white;
                            border: none;
                            padding: 8px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        `;
                        // Event Listener (Inline onclick yerine)
                        copyBtn.addEventListener('click', () => {
                             navigator.clipboard.writeText(share).then(() => {
                                 showToast(`Share #${index+1} copied!`, 'success');
                             });
                        });
                        btnGroup.appendChild(copyBtn);

                        // İndir Butonu
                        const downloadLink = document.createElement('a');
                        downloadLink.href = `data:image/png;base64,${qrRes.qr_image}`;
                        downloadLink.download = `Share_${index + 1}.png`;
                        downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Save QR';
                        downloadLink.style.cssText = `
                            flex: 1;
                            background: #d35400;
                            color: white;
                            text-decoration: none;
                            padding: 8px;
                            border-radius: 4px;
                            font-size: 0.8rem;
                            text-align: center;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 5px;
                            font-weight: bold;
                        `;
                        btnGroup.appendChild(downloadLink);

                        card.appendChild(btnGroup);
                        qrGrid.appendChild(card);
                    }
                } catch (err) {
                    console.error("QR Error:", err);
                }
            } // End for loop

            showToast('Success! Shares and QR codes are ready.', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Server connection error', 'error');
    }
});

// 3. RECOVER
document.getElementById('recover-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sharesInput = document.getElementById('shares-list').value;
    const shares = sharesInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const resultArea = document.getElementById('recover-result-area');
    const secretText = document.getElementById('recovered-secret');

    if (shares.length < 2) {
        showToast('You must enter at least 2 shares', 'error');
        return;
    }

    resultArea.classList.remove('hidden');
    secretText.textContent = 'Recovering...';

    try {
        const response = await fetch('http://127.0.0.1:5000/recover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shares })
        });
        const data = await response.json();

        if (response.ok) {
            secretText.textContent = data.secret;
            showToast('Key successfully recovered!', 'success');
        } else {
            secretText.textContent = 'Recovery failed.';
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Server connection error', 'error');
    }
});

// --- STEGANOGRAPHY: HIDE ---
document.getElementById('btn-hide-stego').addEventListener('click', async () => {
    const text = document.getElementById('stego-input-text').value;
    const fileInput = document.getElementById('stego-upload-file');
    const resultDiv = document.getElementById('stego-result');
    const resultImg = document.getElementById('stego-output-img');

    if (!text || fileInput.files.length === 0) {
        showToast('Please enter text and select an image.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('secret_text', text);

    showToast('Processing image...', 'info');

    try {
        const response = await fetch('http://127.0.0.1:5000/hide-in-image', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            resultImg.src = `data:image/png;base64,${data.stego_image}`;
            resultDiv.classList.remove('hidden');
            showToast('Success! Text hidden in image.', 'success');
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (err) {
        showToast('Processing error', 'error');
    }
});

// --- STEGANOGRAPHY: REVEAL ---
document.getElementById('btn-reveal-stego').addEventListener('click', async () => {
    const fileInput = document.getElementById('recover-stego-file');
    const textArea = document.getElementById('shares-list');

    if (fileInput.files.length === 0) {
        showToast('Please select an image with hidden data.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    showToast('Scanning image...', 'info');

    try {
        const response = await fetch('http://127.0.0.1:5000/reveal-from-image', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            // Append to existing text (as new line)
            const currentVal = textArea.value;
            textArea.value = currentVal ? currentVal + '\n' + data.secret_text : data.secret_text;

            showToast('Hidden data found and added to list!', 'success');
        } else {
            showToast('Error: ' + (data.error || 'Data not found'), 'error');
        }
    } catch (err) {
        showToast('Read error', 'error');
    }
});
// --- STATIC COPY BUTTON LISTENERS (For Extension Compliance) ---
document.getElementById('btn-copy-gen')?.addEventListener('click', () => {
    copyText('generated-mnemonic');
});

document.getElementById('btn-copy-rec')?.addEventListener('click', () => {
    copyText('recovered-secret');
});

document.getElementById('btn-copy-all-shares')?.addEventListener('click', () => {
    copyText('shares-output');
});