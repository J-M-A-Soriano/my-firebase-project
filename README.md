
# NEU Library Log - Institutional Access Intelligence

A professional, academic-grade visitor management and behavioral analytics system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time security enforcement.

**My Personal Project URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🏛️ System Overview
The NEU Library Log provides a secure, digital gateway for academic access. Designed with a **Single Portal Architecture**, the system automatically identifies institutional roles (Admins, Students, Staff) upon Google Authentication and routes them to their designated operational environment.

## 🔑 Access Control & Identity Handshake
The system utilizes a **Synchronous Identity Handshake** to eliminate UI flicker and enforce immediate security.
- **Administrative Authority:** Automatically granted to authorized institutional accounts (e.g., `jcesperanza@neu.edu.ph`). Admins access the **Intelligence Center** and **Visitor Registry**.
- **Standard Access:** Students and staff are verified and routed to the **Check-In Hub** to confirm their affiliation and purpose.
- **Security Enforcement:** Admins can "Block" users in the registry. A blocked account is immediately denied entry across all portal entry points, triggering an institutional security alert.

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
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI (Gemini 2.5 Flash)
- **UI Framework:** ShadCN UI + Tailwind CSS

## 🚀 Institutional Setup (Mandatory)

To enable the institutional entry protocol and resolve authentication faults (`auth/operation-not-allowed`):

1. **Firebase Console**: Open your project at [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication**: Enable the **Google** provider in the "Sign-in method" tab.
3. **Project ID**: Ensure the `src/firebase/config.ts` matches your current Firebase Project settings.
4. **Admin Registry**: To grant dynamic admin access beyond hardcoded emails, add the user's UID to the `admin_users` collection in Firestore.

---
*Developed for the NEU Library Intelligence Systems.*
