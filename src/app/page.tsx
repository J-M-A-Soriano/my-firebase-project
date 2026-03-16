
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, Mail, ArrowRight, Fingerprint, ShieldAlert, MonitorCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, initiateGoogleSignIn } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Institutional Landing Portal & Authentication Gateway.
 * Highly polished interface based on provided design specifications.
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
      <div className="max-w-5xl w-full space-y-12 relative z-10">
        
        {/* Institutional Branding */}
        <div className="text-center space-y-4 mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          
          {/* Highlight: Secure Login Card */}
          <Card className="border-none rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-white overflow-hidden transition-all duration-500 hover:translate-y-[-8px]">
            <div className="bg-[#0f172a] p-6 flex items-center gap-4 px-12 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              <ShieldAlert className="h-4 w-4 text-primary-foreground/60" />
              AUTH VECTOR
            </div>
            <CardContent className="p-16 space-y-12 text-center">
              <div className="space-y-3">
                <h2 className="text-5xl font-black text-foreground uppercase tracking-tight italic leading-tight">SECURE LOGIN</h2>
                <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.4em] opacity-40">ADMIN & PERSONAL ACCESS</p>
              </div>

              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-28 text-sm font-black bg-[#0f172a] text-white hover:bg-black shadow-[0_25px_50px_-12px_rgba(15,23,42,0.3)] rounded-[2.5rem] group transition-all"
                disabled={isProcessing || isUserLoading || isAdminLoading}
              >
                {isProcessing || isUserLoading || isAdminLoading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <Mail className="h-6 w-6" />
                    SIGN IN WITH GOOGLE
                  </div>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-8 pt-4 opacity-30">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="h-3.5 w-3.5" /> SECURE AUTH
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Fingerprint className="h-3.5 w-3.5" /> ENCRYPTED
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary: Access Entry Card */}
          <Card className="border-none rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] bg-white overflow-hidden opacity-90 transition-all duration-500 hover:opacity-100 hover:translate-y-[-4px]">
            <div className="bg-[#3b82f6] p-6 flex items-center justify-between px-12 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              <div className="flex items-center gap-4">
                <MonitorCheck className="h-4 w-4" />
                TERMINAL MODE
              </div>
              <span className="font-mono text-[11px] tabular-nums">{localTime || "--:--"}</span>
            </div>
            <CardContent className="p-16 space-y-12 text-center">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tight italic leading-tight">ACCESS ENTRY</h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-40">VISITOR IDENTIFICATION TERMINAL</p>
              </div>

              <Button 
                asChild
                variant="outline"
                className="w-full h-24 text-[11px] font-black border-4 border-muted/30 rounded-[2.5rem] group hover:bg-primary hover:text-white hover:border-primary shadow-lg transition-all"
              >
                <Link href="/check-in">
                  <div className="flex items-center justify-center gap-4">
                    <MonitorCheck className="h-5 w-5" />
                    OPEN ENTRY TERMINAL
                  </div>
                </Link>
              </Button>

              <div className="px-8 pt-4">
                <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-[0.2em] leading-loose opacity-40">
                  STANDARD TERMINAL FOR STUDENT & STAFF CHECK-IN. REQUIRES INSTITUTIONAL ID VERIFICATION.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Audit */}
        <p className="text-center text-[11px] font-black text-muted-foreground uppercase tracking-[0.6em] opacity-20 pt-12">
          ADVANCING KNOWLEDGE THROUGH SECURE VERIFICATION • NEU IT INFRASTRUCTURE
        </p>
      </div>
    </div>
  );
}
