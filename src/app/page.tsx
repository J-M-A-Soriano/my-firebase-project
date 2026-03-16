
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, LogIn, ArrowRight, Clock, Fingerprint, Scan, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, useFirestore, initiateGoogleSignIn } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
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
      // Hardcoded super-admin email check as requested
      if (user.email === 'jcesperanza@neu.edu.ph') {
        router.push("/dashboard");
        return;
      }

      const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
      if (adminDoc.exists()) {
        router.push("/dashboard");
        return;
      }

      const regularDoc = await getDoc(doc(db, 'regular_users', user.uid));
      if (regularDoc.exists()) {
        router.push("/welcome");
        return;
      }

      // Default to welcome for all other authenticated users
      router.push("/welcome");
    } catch (err) {
      console.error("Role check failed", err);
      // Fallback for UI if error occurs during fetch
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
          <div className="inline-flex items-center justify-center p-5 bg-primary text-white rounded-[2rem] shadow-2xl kiosk-glow transform -rotate-2">
            <BookOpen className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase italic">
              NEU <span className="text-primary not-italic">LIBRARY</span> LOG
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-60">
              Institutional Access Terminal
            </p>
          </div>
        </div>

        <Card className="glass-card overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
          <div className="bg-primary p-3 flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-widest text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Terminal ID: L-01
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> SYSTEM LIVE</span>
              <span className="opacity-50">{localTime || "--:--"}</span>
            </div>
          </div>

          <CardContent className="p-10 space-y-10">
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Security Checkpoint</h2>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-wide opacity-70">Authenticated Access Required</p>
            </div>

            <div className="space-y-6">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-16 text-lg font-black bg-white text-primary border-2 border-primary/20 hover:bg-muted/50 shadow-xl rounded-[1.25rem] group"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-3 h-6 w-6 text-primary" />
                    SIGN IN WITH GOOGLE
                    <ArrowRight className="ml-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </Button>
              
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-[10px] font-black uppercase text-muted-foreground/40">Secure Connection</span>
                <div className="flex-grow border-t border-muted"></div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-[9px] font-black opacity-30">
                  <Scan className="h-4 w-4" /> BIOMETRIC READY
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black opacity-30">
                  <ShieldCheck className="h-4 w-4" /> AES-256 SYNC
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">
          Enterprise Security Infrastructure by NEU Systems
        </p>
      </div>
    </div>
  );
}
