
# NEU Library Log - Institutional Access Intelligence

A professional, academic-grade visitor management and behavioral analytics system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time security enforcement.

**My Personal Project URL:** https://my-firebase-project-ten.vercel.app

---

## 🏛️ System Overview
The NEU Library Log provides a secure, digital gateway for academic access. Designed with a **Single Portal Architecture**, the system automatically identifies institutional roles (Admins, Students, Staff) upon Google Authentication and routes them to their designated operational environment.

## 🔑 Access Control & Identity Handshake
The system utilizes a **Synchronous Identity Handshake** to eliminate UI flicker and enforce immediate security.
- **Institutional Enforcement:** Access is strictly private to `@neu.edu.ph` email accounts. Non-institutional logins are immediately terminated with a security warning.
- **Administrative Authority:** Automatically granted to authorized institutional accounts (e.g., `jcesperanza@neu.edu.ph`). Admins access the **Intelligence Center** and **Visitor Registry**.
- **Standard Access:** Students and staff are verified and routed to the **Check-In Hub** to confirm their affiliation and purpose.
- **Security Enforcement:** Admins can "Block" users in the registry. A blocked account is immediately denied entry across all portal entry points.

## 📊 Intelligence Center (Administrative Dashboard)
The administrative dashboard provides high-fidelity behavioral analytics with multi-vector filtering:
- **Temporal Horizon:** Filter by Day, Week, Month, or a Custom Date Range.
- **Academic Unit:** Analyze traffic across official NEU Colleges (CICS, CEA, CAS, CBA, CED, etc.).
- **Visit Objective:** Categorize usage by intent (Research, Study, Group Projects).
- **Visitor Class:** Differentiate between **Students** and **Employees (Teachers/Staff)**.
- **Technical Reporting:** Generate PDF intelligence reports including all active filter parameters via the integrated jsPDF engine.

## 👥 Visitor Registry (CRUD & Blocking)
The **Visitor Hub** is the central authority for identity management:
- **Full CRUD Suite:** Manually enroll visitors, update affiliations, or purge stale profiles.
- **Access Termination:** A high-impact toggle to "Block" any account, effectively revoking their library portal privileges in real-time.
- **Institutional Profiling:** Every Google login automatically enrolls the user into the registry for future tracking.

## 🤖 AI Pattern Analysis
Integrated with **Google Genkit AI**, the system provides deep insights into library flow:
- Analyzes historical check-in/out timestamps.
- Identifies peak usage vectors and common stay durations.
- Provides strategic operational directives for staffing and resource allocation.

## ⚙️ Architecture Profile
- **Engine:** Next.js 15 (App Router)
- **Database:** Google Cloud Firestore (NoSQL with Real-time Listeners)
- **Identity:** Firebase Authentication (RBAC & Google Institutional SSO)
- **Enforcement:** @neu.edu.ph Domain Restriction
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI (Gemini 2.5 Flash)
- **UI Framework:** ShadCN UI + Tailwind CSS

## 🛠️ Mandatory Configuration (Self-Fix Guide)

1. **Enable Google Provider**:
   - Go to [Firebase Console](https://console.firebase.google.com/) -> **Authentication** -> **Sign-in method**.
   - Enable **Google** and save.

2. **Whitelist Your Domain**:
   - Go to **Authentication** -> **Settings** -> **Authorized domains**.
   - Add the domain shown in your browser's address bar (e.g., `studio-XXX.firebaseapp.com`).

3. **Admin Registry**:
   - To grant admin access to accounts not listed in `firestore.rules`, add the user's UID as a document in the `admin_users` collection in Firestore.

---
*Developed for the NEU Library Intelligence Systems.*
