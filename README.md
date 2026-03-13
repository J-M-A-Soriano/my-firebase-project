# NEU Library Log - Intelligence Center

A professional, high-performance visitor management system for the NEU Library. Designed for high-traffic RFID terminals and administrative oversight.

## 🌐 Browser Compatibility
This application is fully optimized for:
- **Google Chrome** (Recommended for Kiosk mode)
- **Opera**
- **Microsoft Edge**
- **Mozilla Firefox**
- **Safari**

## 🚀 Going Live (Deployment)
This is a dynamic Next.js app. To make it "live" from GitHub:

### 1. Push to GitHub
Upload your project to a private or public repository on GitHub.

### 2. Connect to a Hosting Provider
Since this app uses Firebase and Next.js Server Actions, you should use:
- **Firebase App Hosting (Recommended):** Go to the Firebase Console, select "App Hosting," and connect your GitHub repo. It will automatically build and deploy your site.
- **Vercel:** Connect your GitHub repo to Vercel. It will handle the Next.js environment perfectly.

### 3. Environment Variables
Make sure to copy your Firebase configuration into the environment variables of your hosting provider so the database remains connected.

## 🖥️ Professional Kiosk Setup
For the best experience on your physical terminal:

### 1. Dedicated Kiosk Mode (Chrome)
To prevent users from exiting the app, launch Chrome using the kiosk flag:
`chrome.exe --kiosk https://your-app-url.com`

### 2. Auto-Focus RFID
The app is programmed to automatically capture RFID scans. Ensure no other pop-ups or browser notifications are active on the terminal machine.

### 3. Fullscreen Shortcut
Simply press **F11** once the page loads to hide all browser UI elements.

## 📊 Administrative Access
- **Terminal ID:** L-01
- **Admin Bypass Code:** `ADMIN123` (Type this in the main ID field to access the dashboard)

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Firebase Firestore (Real-time)
- **AI:** Google Genkit (Usage Insights)
- **Styling:** Tailwind CSS / Shadcn UI
- **Reports:** jsPDF + AutoTable
