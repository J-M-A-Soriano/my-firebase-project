"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, Mail, Fingerprint, MonitorCheck, ArrowRight, LockKeyhole, LogOut, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, initiateGoogleSignIn } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import Link from "next/link";

/**
 * @fileOverview NEULibrary Institutional Gateway.
 * Features a high-impact Auth Vector Hero and a minimalist Access Terminal action.
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

  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      await signOut(auth);
      toast({ title: "Session Terminated", description: "You have been securely signed out." });
    } catch (err) {
      toast({ variant: "destructive", title: "Logout Fault", description: "Could not terminate session." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch h-full max-h-[750px]">

        {/* Left Section: SECURE LOGIN HERO (70%) */}
        <Card className="lg:col-span-7 auth-hero flex flex-col justify-between group overflow-hidden shadow-2xl rounded-[2rem]">
          <div className="p-8 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black italic uppercase tracking-tighter leading-none">NEULibrary</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Intelligence Systems</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldCheck className="h-3 w-3 text-accent" />
              <span className="text-[9px] font-black uppercase tracking-widest">Authorized Access</span>
            </div>
          </div>

          <CardContent className="p-10 md:p-16 space-y-10 z-10">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
                {user ? "SYSTEM" : "SECURE"} <br /> <span className="text-accent not-italic">{user ? "ACCESS" : "LOGIN"}</span>
              </h1>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] ml-1">
                {user ? `Authenticated: ${user.email}` : "Admin & Academic Personal Access"}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {user ? (
                <>
                  <Button
                    asChild
                    className="h-16 px-10 rounded-2xl bg-accent text-white text-lg font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                  >
                    <Link href={isAdmin ? "/dashboard" : "/welcome"}>
                      <UserCheck className="mr-4 h-6 w-6" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="h-16 px-10 rounded-2xl border-2 border-white text-white hover:bg-white hover:text-primary text-lg font-black uppercase tracking-widest transition-all"
                  >
                    <LogOut className="mr-4 h-6 w-6" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGoogleLogin}
                  className="w-full md:w-fit h-16 px-12 rounded-2xl bg-white text-primary text-lg font-black uppercase tracking-widest shadow-xl hover:bg-accent hover:text-white transition-all hover:scale-[1.02]"
                  disabled={isProcessing || isUserLoading || isAdminLoading}
                >
                  {isProcessing || isUserLoading || isAdminLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-6">
                      <Mail className="h-6 w-6" />
                      <span>Connect via Google</span>
                    </div>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest opacity-60">
                <LockKeyhole className="h-4 w-4 text-accent" /> OAUTH 2.0
              </div>
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest opacity-60">
                <Fingerprint className="h-4 w-4 text-accent" /> MFA READY
              </div>
            </div>
          </CardContent>

          <div className="p-6 bg-black/20 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.4em] opacity-30 z-10">
            <span>Institutional v3.0.0</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Operational
            </span>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        </Card>

        {/* Right Section: TERMINAL ACTION (30%) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card className="kiosk-card flex-1 flex flex-col justify-between terminal-accent group hover:translate-y-[-4px] border-2 border-white rounded-[2rem]">
            <div className="p-6 flex items-center justify-between border-b border-muted/50">
              <div className="flex items-center gap-2">
                <MonitorCheck className="h-4 w-4 text-accent" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">TERMINAL-01</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums font-black opacity-40">{localTime || "--:--"}</span>
            </div>

            <CardContent className="p-8 text-center space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight italic leading-none">Visitor <br />Entry</h2>
                <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest opacity-40">Public Logging Kiosk</p>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-24 rounded-2xl border-4 border-white hover:border-accent hover:bg-accent/5 transition-all shadow-lg kiosk-button group"
              >
                <Link href="/check-in" className="flex flex-col items-center justify-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent">IDENTIFICATION HUB</span>
                  <ArrowRight className="h-6 w-6 text-accent group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>

              <div className="pt-6 border-t border-dashed border-muted">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-loose opacity-40 px-4">
                  Touch interface optimized.
                </p>
              </div>
            </CardContent>

            <div className="p-4 bg-muted/20 text-center rounded-b-[2rem]">
              <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">NEU LIBRARY SYSTEMS</span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
