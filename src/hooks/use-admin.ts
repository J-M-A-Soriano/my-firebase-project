'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Centralized Administrative Authority Hook.
 * Implements dual-verification: Institutional Hardcode + Firestore Registry.
 * Optimized for performance: Bypasses network calls for hardcoded super-admins.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  // Hardcoded authorized accounts (Institutional Super-Admins)
  const hardcodedAdmins = ['jcesperanza@neu.edu.ph', 'johnmichaelsoriano76@gmail.com'];

  useEffect(() => {
    async function verifyAuthority() {
      // If Firebase Auth is still loading, we must wait
      if (isUserLoading) return;

      // If no user is logged in, reset states
      if (!user || !db) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsAdminLoading(false);
        return;
      }

      // 1. FAST PATH: Check institutional hardcode (Super-Admins)
      // This is local and instantaneous, eliminating "Launching..." latency
      const userEmail = (user.email || '').toLowerCase();
      const superAdminStatus = hardcodedAdmins.some(email => email.toLowerCase() === userEmail);
      
      if (superAdminStatus) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setIsAdminLoading(false);
        return; // Exit early to avoid unnecessary Firestore lookup
      }

      // 2. REGISTRY PATH: Check Firestore for dynamic administrators
      // Only reached if the user is not a hardcoded super-admin
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error("Authority verification failed:", error);
        setIsAdmin(false);
      } finally {
        setIsAdminLoading(false);
      }
    }

    verifyAuthority();
  }, [user, isUserLoading, db]);

  return { 
    isAdmin, 
    isAdminLoading, 
    isSuperAdmin
  };
}
