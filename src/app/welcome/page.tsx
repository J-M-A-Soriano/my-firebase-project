
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, User, LogOut, ShieldCheck, MapPin, Building2, LayoutDashboard, Loader2, CalendarDays } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/nav-bar";

/**
 * @fileOverview Institutional Verification Gateway.
 * Features an automatic 5-second reset to clear the session for the next user.
 * Displays NavBar only for Admins to allow "Simulation Mode" auditing.
 */
export default function AuthorizedGreeting() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Auth teardown failed:", error);
      router.replace("/");
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Auto-reset timer (5 seconds)
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [auth]);

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simulation Mode Header for Admins */}
      {isAdmin && <NavBar />}
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="max-w-4xl w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
          
          <div className="inline-flex items-center justify-center p-10 bg-primary text-white rounded-[2.5rem] shadow-xl border-4 border-white success-glow">
            <CheckCircle2 className="h-16 w-16" />
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Welcome to <br /><span className="text-primary not-italic">NEU Library!</span>
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] opacity-60">
              Institutional Entry Confirmed
            </p>
          </div>

          <Card className="kiosk-card p-10 bg-white/95 border-4 border-white max-w-2xl mx-auto rounded-[2.5rem]">
            <CardContent className="p-0 space-y-10">
              <div className="flex flex-col items-center gap-6">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-black uppercase text-foreground italic tracking-tight">
                    {user?.displayName || "Authorized User"}
                  </p>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: ShieldCheck, label: "Status", value: "Verified", color: "text-primary" },
                  { icon: MapPin, label: "Portal", value: "Gateway-01", color: "text-foreground" },
                  { icon: Building2, label: "Identity", value: "Member", color: "text-foreground" }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-muted/30 rounded-2xl border-2 border-white space-y-2 group hover:bg-primary/5 transition-all">
                    <item.icon className="h-6 w-6 text-primary mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">{item.label}</p>
                    <p className={cn("text-xl font-black uppercase italic", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t-2 border-dashed border-muted space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {isAdmin && (
                    <Button asChild className="flex-1 h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg kiosk-button">
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-3 h-5 w-5" />
                        Admin Hub
                      </Link>
                    </Button>
                  )}
                  <Button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="outline" 
                    className="flex-1 h-14 rounded-xl border-2 border-muted font-black uppercase tracking-widest text-[10px] hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                  >
                    {isLoggingOut ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <LogOut className="mr-3 h-5 w-5" />}
                    Exit Portal
                  </Button>
                </div>
                
                <p className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Resetting for next user in {secondsLeft} seconds
                </p>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.6em]">
            NEU Library Intelligence Systems
          </p>
        </div>
      </main>
    </div>
  );
}
