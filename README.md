# NEU Library Log - System Specifications

A professional, institutional-grade visitor management system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time behavioral analytics.

**My Personal Project URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🏛️ System Overview
The NEU Library Log provides a secure, digital gateway for academic access. Designed with role-based synchronization, the platform ensures that administrative staff can monitor facility intensity while students experience a seamless, verified entry process.

## 🔑 Access Control & Authorization
The system utilizes Google Institutional Authentication for all entry points.
- **Administrative Authority:** Automatically granted to authorized institutional accounts (specifically `jcesperanza@neu.edu.ph`).
- **Regular Access:** Standard students and visitors are routed to a high-impact verification confirmation interface greeting them with: **"Welcome to NEU Library!"**
- **Secure Switching:** Administrative users can safely simulate regular visitor sessions for audit purposes via the secondary navigation.

## 📊 Intelligence Center Specifications
The administrative dashboard provides a high-fidelity "Intelligence Center" view:
- **Temporal Horizon Analysis:** Filter visitor intensity by Day, Week, or Month.
- **Academic Unit Slicing:** Isolate data streams by specific Colleges or Departments.
- **Objective Variance:** Categorize traffic by visit purposes (e.g., Thesis Research, Reading).
- **Visitor Class Vectors:** Differentiate between Student Class and Staff/Employee vectors.
- **Audit Generation:** One-click generation of PDF intelligence reports with active filter parameters.

## 🚀 Institutional Activation (Crucial)

To enable system access and resolve authentication protocol faults, the following administrative action is required in the Google Cloud/Firebase Console:

1. **Access Console**: Open your project in the [Firebase Console](https://console.firebase.google.com/).
2. **Navigate to Auth**: Select **Authentication** from the "Build" menu in the left sidebar.
3. **Enable Provider**: 
   - Click the **Sign-in method** tab.
   - Click **Add new provider**.
   - Select **Google**.
   - Toggle the switch to **Enable**.
   - Configure the **Project support email** and click **Save**.

## ⚙️ Architecture Profile
- **Engine:** Next.js 15 (App Router)
- **Database:** Google Cloud Firestore (Real-time NoSQL)
- **Identity:** Firebase Authentication (RBAC Implementation)
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI Integration
