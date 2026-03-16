
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Centralized Administrative Authority Hook.
 * Optimized with a Synchronous Institutional Handshake to eliminate UI flicker
 * and ensure immediate access for authorized staff.
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

  // SYNCHRONOUS HANDSHAKE: Determine authority immediately if email is known
  const isHardcoded = useMemo(() => {
    if (!user?.email) return false;
    const userEmail = user.email.toLowerCase();
    return hardcodedAdmins.some(email => email.toLowerCase() === userEmail);
  }, [user, hardcodedAdmins]);

  // Identity Persistence Key
  const cacheKey = user ? `neu_lib_is_admin_${user.uid}` : null;

  // Initialize with synchronous check if available to prevent UI flicker
  const [isAdmin, setIsAdmin] = useState<boolean>(isHardcoded);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(isHardcoded);
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

      // 2. Identity Synchronization Check
      if (verifiedUid === user.uid && !isAdminLoading) return;

      // 3. Fast-Path: Institutional Recognition (Hardcoded)
      if (isHardcoded) {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setIsAdminLoading(false);
        setVerifiedUid(user.uid);
        if (typeof window !== 'undefined' && cacheKey) {
          localStorage.setItem(cacheKey, 'true');
        }
        return;
      }

      // 4. Persistence Path: Local Identity Cache
      if (typeof window !== 'undefined' && cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached !== null) {
          setIsAdmin(cached === 'true');
          setIsAdminLoading(false);
          setVerifiedUid(user.uid);
          // Continue to verify dynamic registry in background...
        }
      }

      if (!db) {
        setIsAdminLoading(false);
        return;
      }

      // 5. Registry Path: Dynamic Verification (Firestore)
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        const status = adminDoc.exists();
        
        setIsAdmin(status);
        setIsSuperAdmin(isHardcoded);
        setIsAdminLoading(false);
        setVerifiedUid(user.uid);

        if (typeof window !== 'undefined' && cacheKey) {
          localStorage.setItem(cacheKey, status.toString());
        }
      } catch (error) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        setVerifiedUid(user.uid);
      }
    }

    if (!isUserLoading) {
      verifyAuthority();
    } else {
      setIsAdminLoading(true);
      if (isHardcoded) {
        setIsAdmin(true);
        setIsAdminLoading(false);
      }
    }
  }, [user, isUserLoading, db, isHardcoded, cacheKey, verifiedUid, isAdminLoading]);

  return { 
    isAdmin, 
    isAdminLoading, 
    isSuperAdmin,
    verifiedUid
  };
}
