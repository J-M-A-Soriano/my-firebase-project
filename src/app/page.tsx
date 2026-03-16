
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, Mail, ArrowRight, Fingerprint, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, initiateGoogleSignIn } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview Institutional Landing Portal & Authentication Gateway.
 * Routes users based on institutional role (Admin vs Regular).
 */
export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
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
    if (user && !isUserLoading && !isAdminLoading) {
      if (isAdmin) {
        router.push("/dashboard");
      } else {
        router.push("/welcome");
      }
    }
  }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (err: any) {
      setIsProcessing(false);
      if (err.code === 'auth/popup-closed-by-user') return;
      
      toast({
        variant: "destructive",
        title: "Authentication Protocol Fault",
        description: "Failed to initialize secure institutional login vector. Ensure Google provider is enabled in Firebase.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background selection:bg-primary/20">
      <div className="max-w-2xl w-full space-y-12 relative z-10">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-8 bg-primary text-white rounded-[2.5rem] shadow-2xl transform -rotate-1 border-4 border-white">
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

        <Card className="glass-card overflow-hidden border-none rounded-[3.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-3xl">
          <div className="bg-primary p-5 flex items-center justify-between px-10 text-[10px] font-black uppercase tracking-widest text-primary-foreground/90">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-4 w-4 text-accent" />
              Operational Protocol: Active
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" /> SYSTEM READY</span>
              <span className="opacity-50">{localTime || "--:--"}</span>
            </div>
          </div>

          <CardContent className="p-14 space-y-14">
            <div className="space-y-4 text-center">
              <h2 className="text-4xl font-black text-foreground uppercase tracking-tight italic">Secure Access</h2>
              <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Institutional Verification Required</p>
            </div>

            <div className="space-y-8">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-24 text-xl font-black bg-primary text-white hover:bg-primary/90 shadow-2xl rounded-[2rem] group transition-all"
                disabled={isProcessing || isUserLoading || isAdminLoading}
              >
                {isProcessing || isUserLoading || isAdminLoading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-5 h-7 w-7" />
                    LOGIN WITH INSTITUTIONAL ACCOUNT
                    <ArrowRight className="ml-5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-10 border-t pt-10">
                <div className="flex items-center gap-3 text-[10px] font-black opacity-30 uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> Secure Auth
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black opacity-30 uppercase tracking-widest">
                  <Fingerprint className="h-4 w-4" /> Encrypted Sync
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-30">
          Professional Security Infrastructure • NEU IT Solutions
        </p>
      </div>
    </div>
  );
}
