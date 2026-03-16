
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

  // Synchronous Super-Admin Check (Zero Latency)
  const isHardcoded = useMemo(() => {
    if (!user?.email) return false;
    const userEmail = user.email.toLowerCase();
    return hardcodedAdmins.some(email => email.toLowerCase() === userEmail);
  }, [user, hardcodedAdmins]);

  // Use a user-specific cache key to prevent identity bleed
  const cacheKey = user ? `neu_lib_is_admin_${user.uid}` : null;

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (isHardcoded) return true;
    if (typeof window !== 'undefined' && cacheKey) {
      return localStorage.getItem(cacheKey) === 'true';
    }
    return false;
  });
  
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(isHardcoded);

  useEffect(() => {
    async function verifyAuthority() {
      // If no user, we aren't admin and we aren't loading
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsAdminLoading(false);
        return;
      }

      // If already identified as hardcoded, we can stop loading early
      if (isHardcoded) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setIsAdminLoading(false);
        if (typeof window !== 'undefined' && cacheKey) {
          localStorage.setItem(cacheKey, 'true');
        }
        return;
      }

      // Check user-specific cache
      if (typeof window !== 'undefined' && cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached !== null) {
          setIsAdmin(cached === 'true');
          setIsAdminLoading(false);
        }
      }

      if (!db) return;

      // Registry Path: Background Sync for dynamic admins
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        const status = adminDoc.exists();
        setIsAdmin(status);
        if (typeof window !== 'undefined' && cacheKey) {
          localStorage.setItem(cacheKey, status.toString());
        }
      } catch (error) {
        console.error("Authority verification failed:", error);
      } finally {
        setIsAdminLoading(false);
      }
    }

    if (!isUserLoading) {
      verifyAuthority();
    }
  }, [user, isUserLoading, db, isHardcoded, cacheKey]);

  return { 
    isAdmin, 
    isAdminLoading, 
    isSuperAdmin
  };
}
