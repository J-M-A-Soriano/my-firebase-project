"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, ShieldCheck, Loader2, Mail, 
  MonitorCheck, ArrowRight, UserCheck, 
  LayoutDashboard, LogOut, GraduationCap, Briefcase,
  AlertCircle
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
 * Features an Automated Identity Handshake and Institutional Email Enforcement.
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

  // Sync action pending state with auth state
  useEffect(() => {
    if (user && isActionPending) {
      setIsActionPending(false);
    }
  }, [user, isActionPending]);

  // INSTITUTIONAL ENFORCEMENT & HANDSHAKE
  useEffect(() => {
    const handleIdentityVerification = async () => {
      if (isUserLoading || isAdminLoading || !user) return;

      const email = user.email?.toLowerCase() || "";
      const isInstitutional = email.endsWith("@neu.edu.ph");
      const isDevException = [
        'johnmichaelsoriano76@gmail.com', 
        'johnmichaelsoriano151@gmail.com'
      ].includes(email);

      if (!isInstitutional && !isDevException) {
        toast({
          variant: "destructive",
          title: "Institutional Access Required",
          description: "Access is restricted to @neu.edu.ph accounts only.",
        });
        await signOut(auth);
        return;
      }

      if (verifiedUid !== user.uid) return;

      if (isAdmin === false) {
        router.replace("/check-in");
      }
    };

    handleIdentityVerification();
  }, [user, isAdmin, isAdminLoading, isUserLoading, verifiedUid, router, auth, toast]);

  const handleGoogleLogin = async () => {
    setIsActionPending(true);
    try {
      const result = await initiateGoogleSignIn(auth);
      const email = result.user.email?.toLowerCase() || "";
      const isInstitutional = email.endsWith("@neu.edu.ph");
      const isDevException = [
        'johnmichaelsoriano76@gmail.com', 
        'johnmichaelsoriano151@gmail.com'
      ].includes(email);

      if (!isInstitutional && !isDevException) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your institutional (@neu.edu.ph) email address.",
        });
        await signOut(auth);
        setIsActionPending(false);
        return;
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setIsActionPending(false);
        return;
      }
      
      console.error("Auth Error:", err);
      let description = `Error: ${err.code || err.message}. Ensure Google Auth is enabled.`;
      
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com';
        description = `Domain Unauthorized. Whitelist this in Firebase Console: ${currentDomain}`;
      }

      toast({
        variant: "destructive",
        title: "Authentication Protocol Fault",
        description: description,
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
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        backgroundImage: `url('https://scontent.fmnl8-3.fna.fbcdn.net/v/t39.30808-6/481894944_988488900088897_1188078989470321883_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeEnZawWQVflSCql1enBMRNY630XRJwz97DrfRdEnDP3sKddAPbj7xAfQhbkFqzn0TtodgdbLmbydYhIwqTSpe4K&_nc_ohc=r3Mp_yMQG9gQ7kNvwEMLTq4&_nc_oc=AdrI8Nj4EBgP-T7A0shcnomBJ4el8YRYx-PLmXI702B3hqydxH3Qke33685vk2qhhV0&_nc_zt=23&_nc_ht=scontent.fmnl8-3.fna&_nc_gid=42E8uZ6Y05ED77tR4_vDSQ&_nc_ss=7a30f&oh=00_AfxNXOd0BXDVb_89YyriqgXTQJlPteaPWH8VFQUCRFgwbA&oe=69C2AA4A')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-primary/70 backdrop-blur-[2px] z-0" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch z-10 relative">

        <Card className={cn(
          "auth-hero flex flex-col justify-between group overflow-hidden shadow-2xl rounded-[2rem] md:rounded-[2.5rem] transition-all duration-700 border-none bg-primary/95 backdrop-blur-md",
          showLoginTerminal ? "lg:col-span-7" : "lg:col-span-10"
        )}>
          <div className="p-4 md:p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-6 w-6 md:h-8 md:w-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-base md:text-xl font-black italic uppercase tracking-tighter leading-none text-white">NEULibrary</span>
                <span className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.4em] text-white/40">Intelligence Systems</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldCheck className="h-2.5 w-2.5 md:h-3 md:w-3 text-accent" />
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white">Institutional Access</span>
            </div>
          </div>

          <CardContent className="p-6 md:p-12 space-y-6 md:space-y-8 z-10">
            <div className="space-y-2 md:space-y-3">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-tight text-white">
                {user ? "AUTHORIZED" : "SECURE"} <br /> 
                <span className="text-accent not-italic">{user ? "PERSONA" : "GATEWAY"}</span>
              </h1>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent animate-pulse" />
                <p className="text-white font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px]">
                  Requires Institutional Email (@neu.edu.ph)
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {!user ? (
                <Button
                  onClick={handleGoogleLogin}
                  className="w-full md:w-fit h-12 md:h-14 px-6 md:px-10 rounded-xl bg-white text-primary text-xs md:text-sm font-black uppercase tracking-widest shadow-xl hover:bg-accent hover:text-white transition-all hover:scale-[1.02]"
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
                        className="h-20 md:h-24 rounded-2xl bg-accent text-white font-black uppercase tracking-widest shadow-xl hover:scale-[1.03] transition-all"
                      >
                        <Link href="/dashboard" className="flex flex-col items-center justify-center gap-2">
                          <LayoutDashboard className="h-6 w-6 md:h-7 md:w-7" />
                          <span className="text-[9px] md:text-[11px] tracking-widest">Intelligence Center</span>
                        </Link>
                      </Button>
                      <Button
                        onClick={handleEnterAsVisitor}
                        className="h-20 md:h-24 rounded-2xl bg-white/10 border-2 border-white/20 text-white font-black uppercase tracking-widest shadow-xl hover:bg-white/20 hover:scale-[1.03] transition-all cursor-pointer"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserCheck className="h-6 w-6 md:h-7 md:w-7" />
                          <span className="text-[9px] md:text-[11px] tracking-widest">Visitor Welcome</span>
                        </div>
                      </Button>
                    </>
                  ) : (
                    <div className="col-span-full md:col-span-2 flex flex-col items-center py-6 bg-white/5 rounded-2xl border border-white/10">
                      <Loader2 className="h-8 w-8 text-accent animate-spin mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 text-center">Executing Institutional Handshake...</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="h-10 col-span-full md:col-span-2 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[8px] mt-2"
                  >
                    <LogOut className="mr-2 h-3 w-3" /> Sign Out / Switch Identity
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-6 border-t border-white/10 opacity-60">
              <div className="flex items-center gap-2 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white">
                <GraduationCap className="h-3 md:h-3.5 w-3 md:w-3.5 text-accent" /> Academic-Grade Security
              </div>
              <div className="flex items-center gap-2 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white">
                <Briefcase className="h-3 md:h-3.5 w-3 md:w-3.5 text-accent" /> Institutional Compliance
              </div>
            </div>
          </CardContent>

          <div className="p-3 md:p-4 bg-black/20 flex items-center justify-between text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] text-white/30 z-10">
            <span>NEU-SAFE v4.0</span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
              @neu.edu.ph Enforcement Active
            </span>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        </Card>

        {showLoginTerminal && (
          <div className="lg:col-span-3 flex flex-col gap-6 animate-in fade-in slide-in-from-right-10 duration-1000">
            <Card className="kiosk-card flex-1 flex flex-col justify-between terminal-accent group border-2 border-white rounded-[2rem] md:rounded-[2.5rem] bg-white/95 backdrop-blur-2xl">
              <div className="p-4 md:p-5 flex items-center justify-between border-b border-muted/50">
                <div className="flex items-center gap-2">
                  <MonitorCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-accent" />
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">NL-01</span>
                </div>
                <span className="text-[8px] md:text-[9px] font-mono tabular-nums font-black opacity-40">{localTime || "--:--"}</span>
              </div>

              <CardContent className="p-6 md:p-8 text-center space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-3xl font-black text-foreground uppercase tracking-tight italic leading-none">Access <br />NEULibrary</h2>
                  <p className="text-foreground/40 text-[8px] font-black uppercase tracking-[0.3em]">Identity Verification Hub</p>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-16 md:h-20 rounded-2xl border-2 md:border-4 border-white hover:border-accent hover:bg-accent/5 transition-all shadow-lg kiosk-button group bg-white"
                >
                  <Link href="/check-in" className="flex flex-col items-center justify-center gap-1">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent">TAP TO ENTER</span>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-accent group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>

                <div className="pt-4 border-t border-dashed border-muted">
                  <p className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-widest px-2 leading-relaxed">
                    Student / Faculty Credentials Required
                  </p>
                </div>
              </CardContent>

              <div className="p-3 bg-muted/20 text-center rounded-b-[2rem] md:rounded-b-[2.5rem]">
                <span className="text-[6px] font-black text-muted-foreground/20 uppercase tracking-[0.4em]">NEULIB CORE</span>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
