# NEU Library Log - Intelligence Center

A professional, high-performance visitor management system for the NEU Library. Designed for high-traffic RFID terminals and administrative oversight.

## 🌐 Browser Compatibility
This application is fully optimized for:
- **Google Chrome** (Recommended for Kiosk mode)
- **Opera**
- **Microsoft Edge**
- **Mozilla Firefox**
- **Safari**

## 🚀 How to Put This on GitHub
Since you have already initialized git and committed your files, follow these steps to put it on GitHub:

### 1. Create a Repository on GitHub
1. Go to [github.com](https://github.com) and sign in.
2. Click the **"+"** icon in the top right and select **"New repository"**.
3. Name it `neu-library-log` (or anything you like).
4. Keep it Public or Private, then click **"Create repository"**.
5. Copy the **remote URL** provided (it looks like `https://github.com/your-username/neu-library-log.git`).

### 2. Connect Your Project & Push
In your terminal (the one in the screenshot), run these commands:

```bash
# Add the remote link (paste your copied URL)
git remote add origin https://github.com/your-username/neu-library-log.git

# Rename your branch to main (if not already)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## 🌍 Going Live (Deployment)
Once your code is on GitHub, you can make it a live website:

### 1. Connect to Firebase App Hosting (Recommended)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click on **"App Hosting"** in the sidebar.
4. Click **"Get Started"** and connect your GitHub repository.
5. Firebase will automatically build and deploy your app every time you push code to GitHub.

### 2. Environment Variables
In the Firebase App Hosting settings, ensure you add your Firebase API keys (found in `src/firebase/config.ts`) as environment variables if required by the build process.

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
- **Admin Bypass Code:** `ADMIN123` (Type this in the main ID field on the landing page to access the dashboard)

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Firebase Firestore (Real-time)
- **AI:** Google Genkit (Usage Insights)
- **Styling:** Tailwind CSS / Shadcn UI
- **Reports:** jsPDF + AutoTable
