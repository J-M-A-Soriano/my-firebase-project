
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Centralized Administrative Authority Hook.
 * Implements a High-Performance Identity Caching System with User-Context Guarding
 * to eliminate verification latency and prevent session-switch redirection faults.
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

  // Synchronous Super-Admin Check (Zero Latency)
  const isHardcoded = useMemo(() => {
    if (!user?.email) return false;
    const userEmail = user.email.toLowerCase();
    return hardcodedAdmins.some(email => email.toLowerCase() === userEmail);
  }, [user, hardcodedAdmins]);

  // Use a user-specific cache key to prevent identity bleed
  const cacheKey = user ? `neu_lib_is_admin_${user.uid}` : null;

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAuthority() {
      // 1. Handle Unauthenticated State
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsAdminLoading(false);
        setVerifiedUid(null);
        return;
      }

      // 2. Prevent stale state from previous sessions
      // If the user has changed, we are definitely loading again
      if (verifiedUid !== user.uid) {
        setIsAdminLoading(true);
      }

      // 3. Fast-Path: Synchronous Institutional Recognition
      if (isHardcoded) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setIsAdminLoading(false);
        setVerifiedUid(user.uid);
        if (typeof window !== 'undefined' && cacheKey) {
          localStorage.setItem(cacheKey, 'true');
        }
        return;
      }

      // 4. Cache-Path: Institutional Persistence (localStorage)
      if (typeof window !== 'undefined' && cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached !== null) {
          setIsAdmin(cached === 'true');
          // Even if cached, we set loading to false to allow UI to proceed
          setIsAdminLoading(false);
          setVerifiedUid(user.uid);
        }
      }

      if (!db) return;

      // 5. Registry-Path: Dynamic Authority Verification
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        const status = adminDoc.exists();
        
        setIsAdmin(status);
        setIsAdminLoading(false);
        setVerifiedUid(user.uid);

        if (typeof window !== 'undefined' && cacheKey) {
          localStorage.setItem(cacheKey, status.toString());
        }
      } catch (error) {
        console.error("Authority verification failed:", error);
        // Fallback for students/non-admins
        setIsAdmin(false);
        setIsAdminLoading(false);
        setVerifiedUid(user.uid);
      }
    }

    if (!isUserLoading) {
      verifyAuthority();
    }
  }, [user, isUserLoading, db, isHardcoded, cacheKey, verifiedUid]);

  // CRITICAL: Composite loading state that respects the CURRENT user context
  const effectiveLoading = isAdminLoading || (user !== null && verifiedUid !== user.uid);

  return { 
    isAdmin, 
    isAdminLoading: effectiveLoading, 
    isSuperAdmin
  };
}
