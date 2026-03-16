
# NEU Library Log - System Specifications

A professional, institutional-grade visitor management system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time behavioral analytics.

**My Personal Project URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🏛️ System Overview
The NEU Library Log provides a secure, digital gateway for academic access. Designed with a **Single Portal Architecture**, the system automatically identifies user roles (Admins, Students, Staff) upon institutional authentication and routes them to their designated operational environment.

## 🔑 Access Control & Authorization
The system utilizes Google Institutional Authentication for all entry points.
- **Administrative Authority:** Automatically granted to authorized institutional accounts (specifically `jcesperanza@neu.edu.ph`). Admins access the **Intelligence Center** dashboard.
- **Regular Access:** Standard students and staff are verified and routed to a high-impact confirmation interface greeting them with: **"Welcome to NEU Library!"**
- **Secure Auditing:** Administrative users can toggle to the regular visitor session view via the "Simulation Mode" in the navigation bar to audit the user experience.

## 📊 Intelligence Center (Dashboard)
The administrative dashboard provides high-fidelity behavioral analytics:
- **Multi-Vector Filtering:**
  - **Temporal Horizon:** Day (24h Window), Week, or Month aggregate.
  - **Academic Unit:** Filter by specific Colleges or Offices.
  - **Visit Objective:** Analyze visit purposes (e.g., Reading, Research).
  - **Visitor Class:** Differentiate between **Students** and **Employees (Teacher/Staff)**.
- **Metric Cards:** High-impact cards for Aggregate Traffic, Live Occupancy, and Intensity Windows.
- **Technical Audits:** Generate PDF intelligence reports including all active filter parameters.

## 🚀 Institutional Activation (Mandatory)

To enable system access and resolve authentication protocol faults (`auth/operation-not-allowed`), the following administrative action is required in the Google Cloud/Firebase Console:

1. **Access Console**: Open your project in the [Firebase Console](https://console.firebase.google.com/).
2. **Navigate to Auth**: Select **Authentication** from the left sidebar.
3. **Enable Provider**: 
   - Click the **Sign-in method** tab.
   - Click **Add new provider**.
   - Select **Google**.
   - Toggle **Enable**.
   - Configure the **Project support email** and click **Save**.

## ⚙️ Architecture Profile
- **Engine:** Next.js 15 (App Router)
- **Database:** Google Cloud Firestore (Real-time NoSQL)
- **Identity:** Firebase Authentication (RBAC Implementation)
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI Integration
