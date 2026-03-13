# NEU Library Log - Intelligence Center

A professional, high-performance visitor management system for the NEU Library. Optimized for high-traffic RFID terminals and administrative oversight.

**MyPersonalProject URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🌐 Browser Certification
The system is certified for deployment on modern Chromium-based engines. For maximum reliability, the following environments are recommended:
- **Google Chrome Enterprise** (Stable Channel)
- **Microsoft Edge** (Chromium Engine)
- **Opera One**

## 🖥️ Terminal Deployment & Configuration
To maintain terminal integrity and prevent unauthorized user navigation, the following deployment standards must be applied:

### 1. Sandbox Environment (Chrome Kiosk Mode)
For dedicated terminals, launch the browser using the following command-line flags to initiate a sandboxed session:
`chrome.exe --kiosk --incognito https://my-firebase-project-ten.vercel.app`

### 2. Hardware Integration (RFID/HID)
The system utilizes standard HID (Human Interface Device) drivers. 
- **Compatibility:** Plug-and-play compatible with all ISO/IEC 14443A RFID readers.
- **Input Sync:** The primary authentication field is globally focused to ensure zero-latency scanning.

### 3. Display Calibration
- **Resolution:** Optimized for 1920x1080 Full HD displays.
- **Interface:** Toggle **F11** for chrome-less operation.

## 📊 Administrative Specifications
- **Hardware ID:** TERMINAL-L01 (Main Entry)
- **System Authority:** Authenticated Library Staff only.
- **Security Override:** `ADMIN123`
- **Analytics Access:** Intelligence Hub restricted via Firebase Authentication.

## 🛠️ System Architecture
- **Core Framework:** Next.js 15 (App Router / React 19)
- **Database Engine:** Google Firebase Firestore (Real-time NoSQL)
- **Logic Layer:** Google Genkit (Generative AI Pattern Analysis)
- **Document Generation:** jsPDF Engine with AutoTable extensions
- **Design System:** Tailwind CSS / Shadcn UI Component Library
