"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, Mail, Fingerprint, MonitorCheck, ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, initiateGoogleSignIn } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * @fileOverview Redesigned Institutional Entry Portal.
 * Implements the "Primary Admin Focus" visual hierarchy.
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
        description: "Institutional login vector failed. Please ensure Google Auth is enabled in Console.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 bg-background">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-10 gap-8 items-stretch h-full max-h-[800px]">

        {/* Left Section: SECURE LOGIN HERO (70%) */}
        <Card className="lg:col-span-7 auth-hero flex flex-col justify-between group cursor-pointer" onClick={handleGoogleLogin}>
          <div className="p-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic uppercase tracking-tighter leading-none">NEU Library</span>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Intelligence Systems</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">Authorized Access Only</span>
            </div>
          </div>

          <CardContent className="p-12 md:p-20 space-y-12">
            <div className="space-y-4">
              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">
                Secure <br /> <span className="text-accent not-italic">Login</span>
              </h1>
              <p className="text-white/40 text-sm font-black uppercase tracking-[0.4em]">Admin & Academic Personal Access</p>
            </div>

            <Button
              className="w-full md:w-fit h-24 px-16 rounded-[2rem] bg-white text-primary text-xl font-black uppercase tracking-widest shadow-2xl hover:bg-accent hover:text-white transition-all group-hover:scale-[1.02]"
              disabled={isProcessing || isUserLoading || isAdminLoading}
            >
              {isProcessing || isUserLoading || isAdminLoading ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <div className="flex items-center gap-6">
                  <Mail className="h-8 w-8" />
                  <span>Connect via Google</span>
                </div>
              )}
            </Button>

            <div className="flex items-center gap-10 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-60">
                <LockKeyhole className="h-4 w-4 text-accent" /> OAuth 2.0 Encrypted
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-60">
                <Fingerprint className="h-4 w-4 text-accent" /> Multi-Factor Ready
              </div>
            </div>
          </CardContent>

          <div className="p-8 bg-black/20 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.4em] opacity-30">
            <span>Institutional Protocol v2.5.0</span>
            <span>Server Status: Operational</span>
          </div>
        </Card>

        {/* Right Section: TERMINAL ACTION (30%) */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <Card className="kiosk-card flex-1 flex flex-col justify-between terminal-accent group hover:translate-y-[-4px]">
            <div className="p-8 flex items-center justify-between border-b border-muted">
              <div className="flex items-center gap-3">
                <MonitorCheck className="h-5 w-5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kiosk-01</span>
              </div>
              <span className="text-xs font-mono tabular-nums opacity-60">{localTime || "--:--"}</span>
            </div>

            <CardContent className="p-10 text-center space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight italic">Visitor Entry</h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-50">Public Logging Terminal</p>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-24 rounded-[2rem] border-4 border-muted hover:border-accent hover:bg-accent/5 transition-all shadow-lg kiosk-button"
              >
                <Link href="/check-in" className="flex flex-col items-center justify-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest">IDENTIFICATION TERMINAL</span>
                  <ArrowRight className="h-6 w-6 text-accent" />
                </Link>
              </Button>

              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-loose opacity-40 px-4">
                Rapid identification for students & staff using institutional credentials.
              </p>
            </CardContent>

            <div className="p-6 bg-muted/20 text-center rounded-b-[2rem]">
              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.6em]">Touch Interface Optimized</span>
            </div>
          </Card>

          {/* Minimalist Audit Footer */}
          <div className="text-center p-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.8em] opacity-20">
              NEU DATA SYSTEMS
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}