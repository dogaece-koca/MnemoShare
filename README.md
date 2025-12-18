# 🔐 MnemoShare: Secure Secret Sharing Ecosystem

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![MetaMask](https://img.shields.io/badge/MetaMask-Snap-orange.svg)
![Chrome](https://img.shields.io/badge/Extension-Chrome-green.svg)

**MnemoShare** is a comprehensive Web3 security suite designed to safeguard cryptocurrency secrets (Mnemonic Phrases or Private Keys) using **Shamir's Secret Sharing (SSS)**.

This ecosystem combines three major components:

* A **Python Backend** for cryptography and steganography
* A **MetaMask Snap** for secure, isolated execution
* A **Chrome Extension** for seamless browser-level interaction

---

## 🌟 Key Features

* **🛡️ Shamir's Secret Sharing (SSS):** Splits a secret into (n) cryptographic shares. The original secret can only be reconstructed when at least (t) shares are combined.
* **🦊 MetaMask Snap Integration:** Sensitive splitting operations are executed inside MetaMask’s sandboxed Snap environment, isolating secrets from common web threats.
* **🧩 Chrome Extension:** A lightweight browser companion providing fast access to secret generation, splitting, and recovery tools.
* **📷 QR Code Generation:** Converts secret shares into scannable QR codes for secure, offline physical backups.
* **🖼️ Steganography:** Hides secret shares inside image files using Least Significant Bit (LSB) modification.
* **🎲 BIP-39 Support:** Generates standard-compliant, high-entropy mnemonic phrases.

---

## 🏗️ Architecture

MnemoShare follows a multi-layered security-oriented architecture:

1. **Backend (Python / Flask)**
   Handles Shamir’s Secret Sharing logic, steganography, QR generation, and exposes a web API.

2. **MetaMask Snap (TypeScript)**
   Runs inside MetaMask Flask, securely handling secret input, splitting, and user confirmations.

3. **Chrome Extension (JavaScript / HTML)**
   Provides a browser toolbar interface for quick access without opening the main dashboard.

4. **Frontend (Web Dashboard)**
   A unified UI that connects all services and visualizes operations.

---

## 🚀 Installation & Setup

To run the full MnemoShare ecosystem, you must set up the Backend, MetaMask Snap, and Chrome Extension.

### Prerequisites

* **Node.js** v18+
* **Python** v3.8+
* **MetaMask Flask** (required for Snap development)

---

### 1️⃣ Backend Setup (Python)

Navigate to the backend directory:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The backend will be available at:
**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

### 2️⃣ MetaMask Snap Setup

Open a new terminal in the Snap directory:

```bash
cd mnemoshare-snap

# Install dependencies
yarn install

# Start the Snap server
yarn start
```

The Snap server listens on:
**[http://localhost:8080](http://localhost:8080)**

> MetaMask Flask must be installed and running.

---

### 3️⃣ Chrome Extension Setup

1. Open Google Chrome and navigate to:

   ```
   chrome://extensions
   ```
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `Chrome_extension` directory from the project root.

The MnemoShare icon will appear in the browser toolbar.

---

## 📖 Usage Guide

### Start Services

Ensure both services are running:

* Backend: `python app.py`
* Snap: `yarn start`

---

### Web Dashboard

Access the main interface at:

```
http://127.0.0.1:5000
```

---

### Using MetaMask Snap

1. Open the **Split** tab in the dashboard.
2. Click **Split with MetaMask Snap**.
3. Approve the connection in MetaMask Flask.
4. Enter your secret securely inside MetaMask.

---

### Using the Chrome Extension

1. Click the **MnemoShare** icon in the browser toolbar.
2. Generate, split, or recover secrets directly without opening the dashboard.

---

## 📂 Project Structure

```plaintext
MnemoShare/
├── backend/               # Flask app & cryptographic logic
│   ├── app.py
│   ├── sss_core.py
│   └── requirements.txt
├── Chrome_extension/      # Browser extension source
│   ├── manifest.json
│   └── popup.html
├── mnemoshare-snap/       # MetaMask Snap module
│   ├── packages/
│   │   └── snap/          # Snap source (TypeScript)
│   └── snap.manifest.json
├── frontend/              # Web interface assets
│   ├── templates/
│   └── static/
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the project
2. Create your feature branch:

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:

   ```bash
   git commit -m "Add some AmazingFeature"
   ```
4. Push to the branch:

   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

---

## 📄 License

This project is distributed under the **MIT License**.
See the `LICENSE` file for more information.
