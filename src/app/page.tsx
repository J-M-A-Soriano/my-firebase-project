"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, Mail, Fingerprint, MonitorCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, initiateGoogleSignIn } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        description: "Failed to initialize secure institutional login vector. Please contact IT support.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-6xl w-full space-y-16 relative">
        
        {/* Institutional Branding */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-10 bg-primary text-white rounded-[3rem] shadow-2xl mb-4 border-8 border-white">
            <BookOpen className="h-14 w-14" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tight text-foreground uppercase italic leading-none">
              Libri<span className="text-primary not-italic">Guard</span>
            </h1>
            <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.6em] opacity-60">
              NEU Library Information Systems
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-12 items-stretch">
          
          {/* Highlight: Secure Login Card (PRIMARY) */}
          <Card className="kiosk-card bg-primary text-white group hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden border-none" onClick={handleGoogleLogin}>
            <div className="bg-white/10 p-6 flex items-center gap-4 px-12 text-[10px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Institutional Authority Portal
            </div>
            <CardContent className="p-20 space-y-12 text-center">
              <div className="space-y-4">
                <h2 className="text-6xl font-black uppercase tracking-tight italic leading-tight">Secure Login</h2>
                <p className="text-primary-foreground/60 text-[12px] font-black uppercase tracking-[0.5em]">Admin & Academic Personal Access</p>
              </div>

              <div className="w-full h-32 flex items-center justify-center bg-white text-primary rounded-[2.5rem] shadow-2xl group-hover:bg-accent group-hover:text-primary transition-all">
                {isProcessing || isUserLoading || isAdminLoading ? (
                  <Loader2 className="h-12 w-12 animate-spin" />
                ) : (
                  <div className="flex items-center gap-6 px-12">
                    <Mail className="h-8 w-8" />
                    <span className="text-xl font-black uppercase tracking-widest">Connect via Google</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-10 pt-4 opacity-50">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> OAuth 2.0
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Fingerprint className="h-4 w-4" /> Biometric Ready
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary: Access Entry Card (TERMINAL) */}
          <Card className="kiosk-card group hover:scale-[1.02] transition-all duration-500 overflow-hidden border-none">
            <div className="bg-accent p-6 flex items-center justify-between px-12 text-[10px] font-black uppercase tracking-[0.3em] text-accent-foreground">
              <div className="flex items-center gap-4">
                <MonitorCheck className="h-4 w-4" />
                Terminal L-01
              </div>
              <span className="font-mono tabular-nums">{localTime || "--:--"}</span>
            </div>
            <CardContent className="p-16 space-y-12 text-center">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tight italic">Access Entry</h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Public Logging Kiosk</p>
              </div>

              <Button 
                asChild
                variant="outline"
                className="w-full h-24 border-4 border-primary/20 rounded-[2.5rem] hover:bg-primary hover:text-white hover:border-primary transition-all shadow-xl"
              >
                <Link href="/check-in" className="flex items-center justify-center gap-4">
                  <MonitorCheck className="h-6 w-6" />
                  <span className="text-sm font-black uppercase tracking-widest">Launch Kiosk</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>

              <div className="px-8 pt-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-loose opacity-40">
                  Touch-optimized interface for student & staff entry tracking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Audit */}
        <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.8em] opacity-30 pt-12">
          Advancing Knowledge Through Secure Data Management
        </p>
      </div>
    </div>
  );
}
