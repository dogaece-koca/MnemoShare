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
const generateForm = document.getElementById('generate-form');
if (generateForm) {
    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const strength = document.getElementById('strength').value;
        const resultArea = document.getElementById('generate-result-area');
        const mnemonicText = document.getElementById('generated-mnemonic');

        resultArea.classList.remove('hidden');
        mnemonicText.textContent = 'Generating...';

        try {
            const response = await fetch('/generate', {
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
}

// 2. SPLIT (STANDARD SPLIT - via Form)
const splitForm = document.getElementById('split-form');
if (splitForm) {
    splitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const secret = document.getElementById('secret-input').value.trim();
        const t = parseInt(document.getElementById('threshold-input').value);
        const n = parseInt(document.getElementById('shares-input').value);
        const resultArea = document.getElementById('split-result-area');

        if (!secret) {
            showToast('Please enter a key', 'error');
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
                qrGrid.innerHTML = ''; // Clear previous results

                showToast('Shares created.', 'success');

                // Generate QR Codes (Frontend side)
                data.shares.forEach((share, index) => {
                     const card = document.createElement('div');
                     card.style.cssText = "background: #fff; padding: 10px; border-radius: 8px; text-align: center; color: black; display:inline-block; margin:5px;";

                     const title = document.createElement('strong');
                     title.innerText = `Share #${index + 1}`;
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
                showToast(data.error || 'Operation failed', 'error');
            }
        } catch (error) {
            showToast('Server connection error', 'error');
        }
    });
}

// 3. RECOVER
const recoverForm = document.getElementById('recover-form');
if (recoverForm) {
    recoverForm.addEventListener('submit', async (e) => {
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
            const response = await fetch('/recover', {
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
}

// --- STEGANOGRAPHY OPERATIONS ---
const btnHideStego = document.getElementById('btn-hide-stego');
if (btnHideStego) {
    btnHideStego.addEventListener('click', async () => {
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
            const response = await fetch('/hide-in-image', {
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
}

const btnRevealStego = document.getElementById('btn-reveal-stego');
if (btnRevealStego) {
    btnRevealStego.addEventListener('click', async () => {
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
            const response = await fetch('/reveal-from-image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
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
}

// --- METAMASK SNAP CONNECTION (UPDATED) ---
const snapId = 'local:http://localhost:8080';
const connectSnapBtn = document.getElementById('connect-snap');

// Add click event if button exists
if (connectSnapBtn) {
    connectSnapBtn.addEventListener('click', connectAndSplit);
}

async function connectAndSplit(e) {
    e.preventDefault();

    if (!window.ethereum) {
        showToast('MetaMask is not installed!', 'error');
        return;
    }

    try {
        // 1. Connect Snap
        await window.ethereum.request({
            method: 'wallet_requestSnaps',
            params: { [snapId]: {} }
        });

        // 2. Invoke Snap
        const result = await window.ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
                snapId: snapId,
                request: { method: 'split_secret' }
            }
        });

        if (result && result.shares) {
            // A) Main Text Area
            const sharesTextArea = document.getElementById('shares-output');
            const resultArea = document.getElementById('split-result-area');

            resultArea.classList.remove('hidden');
            sharesTextArea.value = result.shares.join('\n');

            // B) QR Area (Formatted)
            const qrGrid = document.getElementById('qr-grid');
            qrGrid.innerHTML = "";

            // Grid Container Setup
            qrGrid.style.cssText = "display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;";

            result.shares.forEach((share, index) => {
                // CARD DESIGN
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

                // Title
                const title = document.createElement('strong');
                title.innerText = `Share #${index + 1}`;
                title.style.marginBottom = "10px";
                title.style.fontSize = "1.1em";
                title.style.color = "#d35400"; // Orange accent
                card.appendChild(title);

                // QR Code
                const qrDiv = document.createElement('div');
                new QRCode(qrDiv, {
                    text: share,
                    width: 150, // QR size
                    height: 150,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.M
                });
                // Spacing for QR
                qrDiv.style.marginBottom = "15px";
                card.appendChild(qrDiv);

                // Text Area (Scrollable)
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
                    max-height: 80px;      /* Max height */
                    overflow-y: auto;      /* Scroll if overflows */
                    text-align: left;
                    font-family: monospace;
                `;
                card.appendChild(textVal);

                // Copy Button (Small)
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
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
                    showToast(`Share #${index+1} copied!`, 'success');
                };
                card.appendChild(copyBtn);

                qrGrid.appendChild(card);
            });

            showToast("Formatted shares are ready!", 'success');
        }

    } catch (err) {
        console.error(err);
        showToast("Error: " + (err.message || err), 'error');
    }
}