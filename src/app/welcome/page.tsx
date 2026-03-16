
"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, User, LogOut, ShieldCheck, MapPin, Building2, LayoutDashboard, Loader2 } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Institutional Verification Gateway.
 * Displays the requested "Welcome to NEU Library!" greeting for authorized users.
 */
export default function AuthorizedGreeting() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-background">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Authentication teardown failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-12">
        <div className="max-w-5xl w-full text-center space-y-20">
          
          <div className="inline-flex items-center justify-center p-16 bg-primary text-white rounded-[5rem] shadow-2xl success-glow border-[10px] border-white">
            <CheckCircle2 className="h-32 w-32" />
          </div>

          <div className="space-y-8">
            <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Welcome to <br /><span className="text-primary not-italic">NEU Library!</span>
            </h1>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.8em] opacity-60">
              Institutional Entry Verification Confirmed
            </p>
          </div>

          <Card className="kiosk-card p-20 bg-white/95 border-[8px] border-white max-w-4xl mx-auto">
            <CardContent className="p-0 space-y-20">
              <div className="flex flex-col items-center gap-10">
                <div className="h-32 w-32 rounded-[3rem] bg-primary/10 flex items-center justify-center ring-[12px] ring-primary/5">
                  <User className="h-16 w-16 text-primary" />
                </div>
                <div className="space-y-4">
                  <p className="text-6xl font-black uppercase text-foreground italic tracking-tight">
                    {user?.displayName || "Authorized User"}
                  </p>
                  <p className="text-[13px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-50">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { icon: ShieldCheck, label: "Access Status", value: "Verified", color: "text-primary" },
                  { icon: MapPin, label: "Entry Portal", value: "Standard-01", color: "text-foreground" },
                  { icon: Building2, label: "Identity Vector", value: "Institutional", color: "text-foreground" }
                ].map((item, i) => (
                  <div key={i} className="p-12 bg-muted/30 rounded-[3rem] border-4 border-white space-y-4 group hover:bg-primary/5 transition-all">
                    <item.icon className="h-8 w-8 text-primary mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[11px] font-black text-primary uppercase tracking-widest">{item.label}</p>
                    <p className={cn("text-3xl font-black uppercase italic", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {isAdmin && (
                  <Button asChild className="flex-1 h-24 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-2xl kiosk-button">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-4 h-7 w-7" />
                      Intelligence Center
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="outline" 
                  className="flex-1 h-24 rounded-[2rem] border-4 border-muted font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white hover:border-destructive transition-all kiosk-button"
                >
                  {isLoggingOut ? <Loader2 className="mr-4 h-7 w-7 animate-spin" /> : <LogOut className="mr-4 h-7 w-7" />}
                  Secure Portal Exit
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[1em]">
            Advancing Knowledge Through Secure Verification Protocols
          </p>
        </div>
      </main>
    </div>
  );
}
