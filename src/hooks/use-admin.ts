'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Centralized Administrative Authority Hook.
 * Implements a High-Performance Identity Caching System (localStorage) 
 * to eliminate verification latency for returning institutional users.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  // Use a local cache to provide an "instant" identity handshake for returning users
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('neu_lib_is_admin') === 'true';
    }
    return false;
  });
  
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  const hardcodedAdmins = [
    'jcesperanza@neu.edu.ph', 
    'johnmichaelsoriano76@gmail.com', 
    'johnmichaelsoriano151@gmail.com'
  ];

  useEffect(() => {
    async function verifyAuthority() {
      if (isUserLoading) return;

      if (!user || !db) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsAdminLoading(false);
        if (typeof window !== 'undefined') localStorage.removeItem('neu_lib_is_admin');
        return;
      }

      // 1. FAST PATH: Institutional Hardcode (Instant)
      const userEmail = (user.email || '').toLowerCase();
      const superAdminStatus = hardcodedAdmins.some(email => email.toLowerCase() === userEmail);
      
      if (superAdminStatus) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setIsAdminLoading(false);
        if (typeof window !== 'undefined') localStorage.setItem('neu_lib_is_admin', 'true');
        return;
      }

      // 2. CACHED PATH: Check if we already know this user is NOT an admin
      // This prevents the "Launching..." spinner for regular students
      const cachedStatus = localStorage.getItem('neu_lib_is_admin');
      if (cachedStatus === 'false') {
        setIsAdmin(false);
        setIsAdminLoading(false);
        // We still continue to verify in background in case they were promoted
      }

      // 3. REGISTRY PATH: Dynamic Verification (Background Sync)
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        const status = adminDoc.exists();
        setIsAdmin(status);
        if (typeof window !== 'undefined') localStorage.setItem('neu_lib_is_admin', status.toString());
      } catch (error) {
        console.error("Authority verification failed:", error);
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
