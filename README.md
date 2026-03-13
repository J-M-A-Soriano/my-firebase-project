# NEU Library Log - Intelligence Center

A professional, high-performance visitor management system for the NEU Library. Designed for high-traffic RFID terminals and administrative oversight.

**Live Application:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

## 🌐 Browser Compatibility
This application is fully optimized for:
- **Google Chrome** (Recommended for Kiosk mode)
- **Opera**
- **Microsoft Edge**
- **Mozilla Firefox**
- **Safari**

## 🚀 Step 1: Push to GitHub
To put your code on GitHub, follow these steps in your terminal:

### 1. Create a Repository on GitHub
1. Go to [github.com](https://github.com) and sign in.
2. Click the **"+"** icon in the top right and select **"New repository"**.
3. Name it `neu-library-log`.
4. Click **"Create repository"**.
5. Copy the **remote URL** (e.g., `https://github.com/your-username/neu-library-log.git`).

### 2. Connect & Push
Run these commands in your project terminal:
```bash
# Add the remote link (replace with your copied URL)
git remote add origin https://github.com/your-username/neu-library-log.git

# Ensure your branch is named main
git branch -M main

# Push your code
git push -u origin main
```

## 🌍 Step 2: Make it Live for FREE (Vercel Deployment)
Because this app uses dynamic AI features (Genkit) and a database, it needs a "Server" to run. **Vercel** is the best free service for this:

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
2. Click **"Add New"** > **"Project"**.
3. Import your `neu-library-log` repository.
4. **Important Environment Variables:**
   - In the "Environment Variables" section, add:
     - `GEMINI_API_KEY`: (Your Google AI API Key for Genkit)
5. Click **"Deploy"**.

Your website is now live at: **https://my-firebase-project-ten.vercel.app**

## 🖥️ Professional Kiosk Setup
For the best experience on your physical terminal:

### 1. Dedicated Kiosk Mode (Chrome)
To prevent users from exiting the app, launch Chrome using the kiosk flag:
`chrome.exe --kiosk https://my-firebase-project-ten.vercel.app`

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
