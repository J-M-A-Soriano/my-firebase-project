'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Centralized Administrative Authority Hook.
 * Implements dual-verification: Institutional Hardcode + Firestore Registry.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuthority() {
      if (isUserLoading) return;
      if (!user || !db) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }

      // 1. Institutional Super-Admin Check (Hardcoded authorized accounts)
      const hardcodedAdmins = ['jcesperanza@neu.edu.ph', 'johnmichaelsoriano76@gmail.com'];
      const isSuperAdmin = hardcodedAdmins.includes(user.email || '');
      
      if (isSuperAdmin) {
        setIsAdmin(true);
        setIsAdminLoading(false);
        return;
      }

      // 2. Dynamic Registry Check (Firestore)
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

  return { isAdmin, isAdminLoading };
}
