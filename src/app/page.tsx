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
        description: "Institutional login vector failed. Please ensure Google Auth is enabled.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 bg-background">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-10 gap-8 items-stretch h-full max-h-[850px]">

        {/* Left Section: SECURE LOGIN HERO (70%) */}
        <Card className="lg:col-span-7 auth-hero flex flex-col justify-between group overflow-hidden shadow-[0_50px_100px_-20px_rgba(15,23,42,0.3)]">
          <div className="p-10 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic uppercase tracking-tighter leading-none">Libriguard</span>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Intelligence Systems</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">Authorized Access Only</span>
            </div>
          </div>

          <CardContent className="p-12 md:p-24 space-y-16 z-10">
            <div className="space-y-6">
              <h1 className="text-8xl md:text-9xl font-black uppercase tracking-tighter italic leading-none">
                SECURE <br /> <span className="text-accent not-italic">LOGIN</span>
              </h1>
              <p className="text-white/50 text-base font-black uppercase tracking-[0.5em] ml-2">Admin & Academic Personal Access</p>
            </div>

            <Button
              onClick={handleGoogleLogin}
              className="w-full md:w-fit h-28 px-20 rounded-[3rem] bg-white text-primary text-2xl font-black uppercase tracking-widest shadow-[0_32px_64px_-16px_rgba(255,255,255,0.2)] hover:bg-accent hover:text-white transition-all hover:scale-[1.05] active:scale-95"
              disabled={isProcessing || isUserLoading || isAdminLoading}
            >
              {isProcessing || isUserLoading || isAdminLoading ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <div className="flex items-center gap-8">
                  <Mail className="h-8 w-8" />
                  <span>Connect via Google</span>
                </div>
              )}
            </Button>

            <div className="flex items-center gap-12 pt-12 border-t border-white/10">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest opacity-60">
                <LockKeyhole className="h-5 w-5 text-accent" /> OAUTH 2.0 ENCRYPTED
              </div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest opacity-60">
                <Fingerprint className="h-5 w-5 text-accent" /> MULTI-FACTOR READY
              </div>
            </div>
          </CardContent>

          <div className="p-8 bg-black/20 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.5em] opacity-30 z-10">
            <span>Institutional Protocol v3.0.0</span>
            <span className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Server Status: Operational
            </span>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[70%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        </Card>

        {/* Right Section: TERMINAL ACTION (30%) */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <Card className="kiosk-card flex-1 flex flex-col justify-between terminal-accent group hover:translate-y-[-8px] border-4 border-white">
            <div className="p-8 flex items-center justify-between border-b-2 border-muted/50">
              <div className="flex items-center gap-3">
                <MonitorCheck className="h-5 w-5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">TERMINAL-01</span>
              </div>
              <span className="text-xs font-mono tabular-nums font-black opacity-40">{localTime || "--:--"}</span>
            </div>

            <CardContent className="p-12 text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tight italic leading-none">Visitor <br />Entry</h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-40">Public Logging Kiosk</p>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-32 rounded-[2.5rem] border-[6px] border-white hover:border-accent hover:bg-accent/5 transition-all shadow-2xl kiosk-button group"
              >
                <Link href="/check-in" className="flex flex-col items-center justify-center gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-accent">IDENTIFICATION HUB</span>
                  <ArrowRight className="h-8 w-8 text-accent group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>

              <div className="pt-8 border-t-2 border-dashed border-muted">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-loose opacity-40 px-6">
                  Touch interface optimized for rapid identification.
                </p>
              </div>
            </CardContent>

            <div className="p-6 bg-muted/20 text-center rounded-b-[2rem]">
              <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.6em]">NEU LIBRARY SYSTEMS</span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}