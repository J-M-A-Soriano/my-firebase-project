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
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  // Hardcoded authorized accounts (Institutional Super-Admins)
  const hardcodedAdmins = ['jcesperanza@neu.edu.ph', 'johnmichaelsoriano76@gmail.com'];

  useEffect(() => {
    async function verifyAuthority() {
      if (isUserLoading) return;
      if (!user || !db) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsAdminLoading(false);
        return;
      }

      const superAdminStatus = hardcodedAdmins.includes(user.email || '');
      setIsSuperAdmin(superAdminStatus);
      
      let registryAdmin = false;
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        registryAdmin = adminDoc.exists();
      } catch (error) {
        console.error("Authority verification failed:", error);
      }

      // Final authority check
      const finalAdminStatus = superAdminStatus || registryAdmin;
      
      setIsAdmin(finalAdminStatus);
      setIsAdminLoading(false);
    }

    verifyAuthority();
  }, [user, isUserLoading, db]);

  return { 
    isAdmin, 
    isAdminLoading, 
    isSuperAdmin
  };
}
