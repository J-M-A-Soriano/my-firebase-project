# NEU Library Log - Intelligence Center

A professional, high-performance visitor management system for the NEU Library. Optimized for high-traffic RFID terminals and administrative oversight.

**Deployment URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🌐 Browser Compatibility
This system is certified for deployment on modern chromium-based environments:
- **Google Chrome** (Recommended for Kiosk mode)
- **Microsoft Edge**
- **Opera**
- **Safari** (macOS/iOS)

## 🖥️ Professional Kiosk Configuration
For production-grade terminal deployment, follow these optimization steps:

### 1. Dedicated Kiosk Mode (Chrome)
Launch the terminal in a sandboxed environment to prevent unauthorized navigation:
`chrome.exe --kiosk https://my-firebase-project-ten.vercel.app`

### 2. Hardware Synchronization (RFID)
The system is configured for high-speed HID (Human Interface Device) input. Ensure the RFID reader is connected and recognized as a keyboard input device. No additional drivers are required.

### 3. Display Optimization
- **Fullscreen:** Toggle **F11** to eliminate browser UI overhead.
- **Auto-Focus:** The primary identification field is hard-coded to maintain focus for rapid scanning.

## 📊 Administrative Oversight
- **Terminal ID:** L-01 (Primary Gate)
- **Security Override Code:** `ADMIN123`
- **Analytics Hub:** Accessible via the "Intelligence Center" in the navigation bar.

## 🛠️ Technical Architecture
- **Framework:** Next.js 15 (App Router Architecture)
- **Data Layer:** Firebase Firestore (Real-time synchronization)
- **Intelligence Engine:** Google Genkit (Generative AI Analytics)
- **Reporting:** Integrated jsPDF Engine with AutoTable extensions
- **Styling:** Tailwind CSS with Shadcn/UI primitives
