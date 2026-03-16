
# NEU Library Log - System Specifications

A professional, institutional-grade visitor management system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time behavioral analytics.

**My Personal Project URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🏛️ System Overview
The NEU Library Log provides a secure, digital gateway for academic access. Designed with role-based synchronization, the platform ensures that administrative staff can monitor facility intensity while students experience a seamless, verified entry process.

## 🔑 Access Control & Authorization
The system utilizes Google Institutional Authentication for all entry points.
- **Administrative Authority:** Automatically granted to authorized institutional accounts (specifically `jcesperanza@neu.edu.ph`).
- **Regular Access:** Standard students and visitors are routed to a verification confirmation interface.
- **Secure Switching:** Administrative users can safely simulate regular visitor sessions for audit purposes via the secondary navigation.

## 📊 Intelligence Center Specifications
The administrative dashboard provides a high-fidelity "Intelligence Center" view:
- **Temporal Horizon Analysis:** Filter visitor intensity by Day, Week, or Month.
- **Academic Unit Slicing:** Isolate data streams by specific Colleges or Departments.
- **Objective Variance:** Categorize traffic by visit purposes (e.g., Thesis Research, Reading).
- **Visitor Class Vectors:** Differentiate between Student Class and Staff/Employee vectors.
- **Audit Generation:** One-click generation of PDF intelligence reports with active filter parameters.

## 🚀 Professional Deployment Guide

To ensure system functionality, follow these institutional setup steps:

1. **GitHub Synchronization**:
   - Ensure the project is synced to your institutional repository.
   - Any push to the `main` branch will automatically trigger a production build.

2. **Vercel Live Deployment**:
   - The application is configured to run on Vercel for dynamic scaling.
   - Ensure all Firebase environment variables are mirrored in the Vercel project settings.

3. **Authentication Activation**:
   - **Crucial:** Go to the Firebase Console.
   - Navigate to **Authentication > Sign-in method**.
   - Enable the **Google** provider. Without this step, the `auth/operation-not-allowed` error will persist at the terminal.

## ⚙️ Architecture Profile
- **Engine:** Next.js 15 (App Router)
- **Database:** Google Cloud Firestore (Real-time NoSQL)
- **Identity:** Firebase Authentication (RBAC Implementation)
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI Integration
