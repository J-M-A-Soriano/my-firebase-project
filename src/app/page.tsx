
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, Mail, ArrowRight, Fingerprint, Scan, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, useFirestore, initiateGoogleSignIn } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !isUserLoading) {
      checkUserRolesAndRedirect();
    }
  }, [user, isUserLoading]);

  const checkUserRolesAndRedirect = async () => {
    if (!user || !db) return;
    setIsProcessing(true);

    try {
      // Direct email check for primary admin account
      const isAdminEmail = user.email === 'jcesperanza@neu.edu.ph';
      const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
      
      if (isAdminEmail || adminDoc.exists()) {
        router.push("/dashboard");
      } else {
        router.push("/welcome");
      }
    } catch (err) {
      router.push("/welcome");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsProcessing(true);
    initiateGoogleSignIn(auth);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background selection:bg-primary/20">
      <div className="max-w-2xl w-full space-y-12 relative z-10">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-6 bg-primary text-white rounded-[2.5rem] shadow-2xl transform -rotate-2">
            <BookOpen className="h-12 w-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground uppercase italic leading-none">
              NEU <span className="text-primary not-italic">LIBRARY</span> LOG
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] opacity-60">
              Institutional Intelligence Gateway
            </p>
          </div>
        </div>

        <Card className="glass-card overflow-hidden border-none rounded-[3rem] shadow-2xl bg-white/90 backdrop-blur-2xl">
          <div className="bg-primary p-4 flex items-center justify-between px-10 text-[10px] font-black uppercase tracking-widest text-primary-foreground/90">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-4 w-4 text-accent" />
              Terminal ID: L-01-ENTRY
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" /> SYSTEM READY</span>
              <span className="opacity-50">{localTime || "--:--"}</span>
            </div>
          </div>

          <CardContent className="p-12 space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tight italic">Security Protocol</h2>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-60">Identity Verification Required</p>
            </div>

            <div className="space-y-8">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-20 text-xl font-black bg-primary text-white hover:bg-primary/90 shadow-2xl rounded-3xl group transition-all"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-4 h-6 w-6" />
                    LOGIN WITH INSTITUTIONAL ACCOUNT
                    <ArrowRight className="ml-4 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-8 border-t pt-8">
                <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase tracking-widest">
                  <Fingerprint className="h-4 w-4" /> Biometric Sync
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> Secure Auth
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase tracking-widest">
                  <Scan className="h-4 w-4" /> RFID Ready
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-30">
          Professional Security Infrastructure • NEU IT Solutions
        </p>
      </div>
    </div>
  );
}
