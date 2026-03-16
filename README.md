
# NEU Library Log - System Specifications

A professional, institutional-grade visitor management system for the NEU Library. Engineered for high-traffic terminals, granular administrative oversight, and real-time behavioral analytics.

**My Personal Project URL:** [https://my-firebase-project-ten.vercel.app](https://my-firebase-project-ten.vercel.app)

---

## 🏛️ System Overview
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

## 🚀 Professional Deployment Guide

To host this system professionally for free via GitHub and Vercel:

1. **GitHub Synchronization**:
   - Create a new repository on [GitHub](https://github.com).
   - In your project terminal, run:
     ```bash
     git remote add origin <your-repo-link>
     git add .
     git commit -m "Initialize Institutional Build"
     git push -u origin main
     ```

2. **Vercel Live Deployment**:
   - Create a free account on [Vercel](https://vercel.com).
   - Select "Import Project" and connect your GitHub repository.
   - Add your Firebase environment variables from `src/firebase/config.ts`.
   - Click **Deploy**. Your app will be live on a professional `.vercel.app` URL.

## ⚙️ Architecture Profile
- **Engine:** Next.js 15 (App Router)
- **Database:** Google Cloud Firestore (Real-time NoSQL)
- **Identity:** Firebase Authentication (RBAC Implementation)
- **Analytics:** Recharts Visualization Engine
- **Reporting:** jsPDF Technical Engine
- **Intelligence:** Google Genkit AI Integration
