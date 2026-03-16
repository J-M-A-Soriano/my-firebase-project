'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Centralized Administrative Authority Hook.
 * Implements dual-verification: Institutional Hardcode + Firestore Registry.
 * Now includes a "Simulation Mode" for super-admins to audit the regular user experience.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [simulationMode, setSimulationModeState] = useState<boolean>(false);

  // Hardcoded authorized accounts (Institutional Super-Admins)
  const hardcodedAdmins = ['jcesperanza@neu.edu.ph', 'johnmichaelsoriano76@gmail.com'];

  useEffect(() => {
    // Restore simulation mode from session storage
    const storedSimMode = sessionStorage.getItem('neu_admin_sim_mode');
    if (storedSimMode === 'true') {
      setSimulationModeState(true);
    }
  }, []);

  const setSimulationMode = useCallback((value: boolean) => {
    setSimulationModeState(value);
    sessionStorage.setItem('neu_admin_sim_mode', value ? 'true' : 'false');
  }, []);

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

      // Final authority check:
      // If simulation mode is ON, we act as a regular user regardless of actual status
      // unless we are specifically checking for "isSuperAdmin"
      const finalAdminStatus = (superAdminStatus || registryAdmin) && !simulationMode;
      
      setIsAdmin(finalAdminStatus);
      setIsAdminLoading(false);
    }

    verifyAuthority();
  }, [user, isUserLoading, db, simulationMode]);

  return { 
    isAdmin, 
    isAdminLoading, 
    isSuperAdmin, 
    simulationMode, 
    setSimulationMode 
  };
}
