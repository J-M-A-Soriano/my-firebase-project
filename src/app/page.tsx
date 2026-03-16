"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, ShieldCheck, Loader2, Mail, 
  MonitorCheck, ArrowRight, UserCheck, 
  LayoutDashboard, LogOut, GraduationCap, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, useUser, initiateGoogleSignIn } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signOut } from "firebase/auth";

/**
 * @fileOverview NEULibrary Institutional Gateway.
 * Features an Automated Identity Handshake and Security Enforcement Protocol.
 */
export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { isAdmin, isAdminLoading, verifiedUid } = useAdmin();
  const [isActionPending, setIsActionPending] = useState(false);
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync action pending state with auth state to prevent deadlocks
  useEffect(() => {
    if (user && isActionPending) {
      setIsActionPending(false);
    }
  }, [user, isActionPending]);

  // INSTITUTIONAL IDENTITY HANDSHAKE: Automated routing to the verification hub
  useEffect(() => {
    const handleIdentityVerification = async () => {
      // Wait for auth and admin status to resolve
      if (isUserLoading || isAdminLoading || !user) return;

      // CRITICAL: Ensure we are operating on the correct verified ID for this specific session
      if (verifiedUid !== user.uid) return;

      // ROUTE TO UNIFIED CHECK-IN FLOW ONLY FOR DEFINITIVE NON-ADMINS
      if (isAdmin === false) {
        router.replace("/check-in");
      }
    };

    handleIdentityVerification();
  }, [user, isAdmin, isAdminLoading, isUserLoading, verifiedUid, router]);

  const handleGoogleLogin = async () => {
    setIsActionPending(true);
    try {
      await initiateGoogleSignIn(auth);
      // isActionPending is reset by the useEffect above once user is detected
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setIsActionPending(false);
        return;
      }
      toast({
        variant: "destructive",
        title: "Authentication Protocol Fault",
        description: "Institutional login vector failed. Please ensure Google Auth is enabled.",
      });
      setIsActionPending(false);
    }
  };

  const handleEnterAsVisitor = async () => {
    router.push("/check-in");
  };

  const handleSignOut = async () => {
    setIsActionPending(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      toast({ title: "Sign Out Failed", variant: "destructive" });
    } finally {
      setIsActionPending(false);
    }
  };

  const showPersonaSelection = user && !isAdminLoading && isAdmin;
  const showLoginTerminal = !user && !isUserLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch h-full">

        <Card className={cn(
          "auth-hero flex flex-col justify-between group overflow-hidden shadow-2xl rounded-[2.5rem] transition-all duration-700 border-none",
          showLoginTerminal ? "lg:col-span-7" : "lg:col-span-10"
        )}>
          <div className="p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <BookOpen className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic uppercase tracking-tighter leading-none text-white">NEULibrary</span>
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40">Intelligence Systems</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldCheck className="h-3 w-3 text-accent" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Institutional Access</span>
            </div>
          </div>

          <CardContent className="p-8 md:p-12 space-y-8 z-10">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none text-white">
                {user ? "AUTHORIZED" : "SECURE"} <br /> 
                <span className="text-accent not-italic">{user ? "PERSONA" : "GATEWAY"}</span>
              </h1>
              <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.3em] ml-1">
                {isUserLoading || isActionPending || isAdminLoading ? "Verifying Identity..." : user ? `Identity Verified: ${user.email}` : "Institutional Google Account Required"}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {!user ? (
                <Button
                  onClick={handleGoogleLogin}
                  className="w-full md:w-fit h-12 px-10 rounded-xl bg-white text-primary text-sm font-black uppercase tracking-widest shadow-xl hover:bg-accent hover:text-white transition-all hover:scale-[1.02]"
                  disabled={isActionPending || isUserLoading}
                >
                  {isActionPending || isUserLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5" />
                      <span>Connect Institutional Account</span>
                    </div>
                  )}
                </Button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {showPersonaSelection ? (
                    <>
                      <Button
                        asChild
                        className="h-24 rounded-2xl bg-accent text-white font-black uppercase tracking-widest shadow-xl hover:scale-[1.03] transition-all"
                      >
                        <Link href="/dashboard" className="flex flex-col items-center justify-center gap-2">
                          <LayoutDashboard className="h-7 w-7" />
                          <span className="text-[11px] tracking-widest">Intelligence Center</span>
                        </Link>
                      </Button>
                      <Button
                        onClick={handleEnterAsVisitor}
                        className="h-24 rounded-2xl bg-white/10 border-2 border-white/20 text-white font-black uppercase tracking-widest shadow-xl hover:bg-white/20 hover:scale-[1.03] transition-all cursor-pointer"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserCheck className="h-7 w-7" />
                          <span className="text-[11px] tracking-widest">Visitor Welcome</span>
                        </div>
                      </Button>
                    </>
                  ) : (
                    <div className="col-span-2 flex flex-col items-center py-6 bg-white/5 rounded-2xl border border-white/10">
                      <Loader2 className="h-8 w-8 text-accent animate-spin mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Executing Identity Handshake...</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="h-10 col-span-2 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[8px] mt-2"
                  >
                    <LogOut className="mr-2 h-3 w-3" /> Sign Out / Switch Identity
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-white/10 opacity-60">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
                <GraduationCap className="h-3.5 w-3.5 text-accent" /> Academic-Grade Security
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
                <Briefcase className="h-3.5 w-3.5 text-accent" /> Institutional Compliance
              </div>
            </div>
          </CardContent>

          <div className="p-4 bg-black/20 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.4em] text-white/30 z-10">
            <span>Core v3.6</span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
              Unified REDIRECTION Handshake Active
            </span>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        </Card>

        {showLoginTerminal && (
          <div className="lg:col-span-3 flex flex-col gap-6 animate-in fade-in slide-in-from-right-10 duration-1000">
            <Card className="kiosk-card flex-1 flex flex-col justify-between terminal-accent group hover:translate-y-[-4px] border-2 border-white rounded-[2.5rem]">
              <div className="p-5 flex items-center justify-between border-b border-muted/50">
                <div className="flex items-center gap-2">
                  <MonitorCheck className="h-4 w-4 text-accent" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">NL-01</span>
                </div>
                <span className="text-[9px] font-mono tabular-nums font-black opacity-30">{localTime || "--:--"}</span>
              </div>

              <CardContent className="p-6 text-center space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight italic leading-none">Access <br />NEULibrary</h2>
                  <p className="text-muted-foreground text-[7px] font-black uppercase tracking-widest opacity-40">Identity Verification Hub</p>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-20 rounded-2xl border-4 border-white hover:border-accent hover:bg-accent/5 transition-all shadow-lg kiosk-button group"
                >
                  <Link href="/check-in" className="flex flex-col items-center justify-center gap-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent">TAP TO ENTER</span>
                    <ArrowRight className="h-5 w-5 text-accent group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </Button>

                <div className="pt-4 border-t border-dashed border-muted">
                  <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-30 px-2 leading-relaxed">
                    Student / Faculty Credentials Required
                  </p>
                </div>
              </CardContent>

              <div className="p-3 bg-muted/20 text-center rounded-b-[2.5rem]">
                <span className="text-[6px] font-black text-muted-foreground/20 uppercase tracking-[0.4em]">NEULIB CORE</span>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
