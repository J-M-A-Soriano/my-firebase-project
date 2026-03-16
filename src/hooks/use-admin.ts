
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  
  const hardcodedAdmins = useMemo(() => [
    'jcesperanza@neu.edu.ph', 
    'johnmichaelsoriano76@gmail.com', 
    'johnmichaelsoriano151@gmail.com',
    'admin@neu.edu.ph'
  ], []);

  // Use a local cache to provide an "instant" identity handshake
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const userEmail = (user?.email || '').toLowerCase();
      const isHardcoded = hardcodedAdmins.includes(userEmail);
      if (isHardcoded) return true;
      return localStorage.getItem('neu_lib_is_admin') === 'true';
    }
    return false;
  });
  
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const userEmail = (user?.email || '').toLowerCase();
      // If they are hardcoded or we have a cached 'false', we are not "loading"
      if (hardcodedAdmins.includes(userEmail)) return false;
      const cached = localStorage.getItem('neu_lib_is_admin');
      return cached === null;
    }
    return true;
  });
  
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    const userEmail = (user?.email || '').toLowerCase();
    return hardcodedAdmins.includes(userEmail);
  });

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

      const userEmail = (user.email || '').toLowerCase();
      const superAdminStatus = hardcodedAdmins.some(email => email.toLowerCase() === userEmail);
      
      // Fast-path: SuperAdmin check is synchronous and instant
      if (superAdminStatus) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setIsAdminLoading(false);
        if (typeof window !== 'undefined') localStorage.setItem('neu_lib_is_admin', 'true');
        return;
      }

      // Check cache again to see if we can finish early
      const cachedStatus = typeof window !== 'undefined' ? localStorage.getItem('neu_lib_is_admin') : null;
      if (cachedStatus === 'false') {
        setIsAdmin(false);
        setIsAdminLoading(false);
      }

      // Registry Path: Background Sync for dynamic admins
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
  }, [user, isUserLoading, db, hardcodedAdmins]);

  return { 
    isAdmin, 
    isAdminLoading, 
    isSuperAdmin
  };
}
