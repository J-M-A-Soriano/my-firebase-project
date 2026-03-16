# NEU Library Log - Enterprise Intelligence Center

A high-performance, institutional visitor management system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time behavioral analytics.

**My Personal Project URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🏛️ Institutional Overview
The NEU Library Log provides a secure, digital gateway for academic access. Designed with role-based synchronization, the platform ensures that administrative staff can monitor facility intensity while students experience a seamless, verified entry process.

## 🔑 Access Control & Authorization
The system utilizes Google Institutional Authentication for all entry points.
- **Administrative Authority:** Automatically granted to authorized institutional accounts (e.g., `jcesperanza@neu.edu.ph`).
- **Regular Access:** Standard students and visitors are routed to a verification confirmation interface.
- **Secure Switching:** Administrative users can safely simulate regular visitor sessions for audit purposes via the secondary navigation.

## 📊 Intelligence Center Specifications
The administrative dashboard provides a high-fidelity "Intelligence Center" view:
- **Temporal Horizon Analysis:** Filter visitor intensity by Day, Week, or Month.
- **Academic Unit Slicing:** Isolate data streams by specific Colleges or Departments.
- **Objective Variance:** Categorize traffic by visit purposes (e.g., Thesis Research, Reading).
- **Visitor Class Vectors:** Differentiate between Student Class and Staff/Employee vectors.
- **Audit Generation:** One-click generation of PDF intelligence reports with active filter parameters.

## 🛠️ Deployment & Terminal Standards
For maximum operational integrity in kiosk environments:
- **Browser:** Certified for Google Chrome Enterprise or Microsoft Edge (Chromium).
- **Environment:** Launch in `--kiosk` mode to prevent navigation leakage.
- **Calibration:** Optimized for 1920x1080 resolution.
- **Security:** AES-256 encrypted real-time synchronization via Google Firebase.

## ⚙️ Architecture Profile
- **Engine:** Next.js 15 (App Router)
- **Database:** Google Cloud Firestore (Real-time NoSQL)
- **Identity:** Firebase Authentication (RBAC Implementation)
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI Integration