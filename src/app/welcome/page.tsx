
"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, User, LogOut, ShieldCheck, MapPin, Building2, LayoutDashboard } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @fileOverview High-impact Verification Gateway.
 * Displays requested "Welcome to NEU Library!" greeting for authorized visitors.
 */
export default function WelcomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading) return null;

  const isAdmin = user?.email === 'jcesperanza@neu.edu.ph';

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center p-10">
        <div className="max-w-4xl w-full text-center space-y-16">
          <div className="inline-flex items-center justify-center p-12 bg-primary text-white rounded-[4rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] success-pulse border-8 border-white">
            <CheckCircle2 className="h-28 w-28" />
          </div>

          <div className="space-y-6">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Welcome to <span className="text-primary not-italic">NEU Library!</span>
            </h1>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.6em] opacity-60">
              Institutional Entry Verification Confirmed
            </p>
          </div>

          <Card className="glass-card border-none rounded-[4rem] shadow-2xl p-16 overflow-hidden bg-white/95 backdrop-blur-3xl border-4 border-white">
            <CardContent className="p-0 space-y-16">
              <div className="flex flex-col items-center gap-8">
                <div className="h-28 w-28 rounded-[2.5rem] bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                  <User className="h-14 w-14 text-primary" />
                </div>
                <div className="space-y-3">
                  <p className="text-5xl font-black uppercase text-foreground italic tracking-tight">
                    {user?.displayName || "Verified User"}
                  </p>
                  <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-10 bg-muted/30 rounded-[2.5rem] border-2 border-white space-y-3 group hover:bg-primary/5 transition-all">
                  <ShieldCheck className="h-6 w-6 text-primary mx-auto opacity-40 group-hover:opacity-100" />
                  <p className="text-[11px] font-black text-primary uppercase tracking-widest">Vector Status</p>
                  <p className="text-2xl font-black uppercase italic text-cyan-700">Authorized</p>
                </div>
                <div className="p-10 bg-muted/30 rounded-[2.5rem] border-2 border-white space-y-3 group hover:bg-primary/5 transition-all">
                  <MapPin className="h-6 w-6 text-primary mx-auto opacity-40 group-hover:opacity-100" />
                  <p className="text-[11px] font-black text-primary uppercase tracking-widest">Terminal</p>
                  <p className="text-2xl font-black uppercase italic">Primary L-01</p>
                </div>
                <div className="p-10 bg-muted/30 rounded-[2.5rem] border-2 border-white space-y-3 group hover:bg-primary/5 transition-all">
                  <Building2 className="h-6 w-6 text-primary mx-auto opacity-40 group-hover:opacity-100" />
                  <p className="text-[11px] font-black text-primary uppercase tracking-widest">Affiliation</p>
                  <p className="text-2xl font-black uppercase italic">Institutional</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {isAdmin && (
                  <Button asChild className="w-full h-20 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-2xl">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-4 h-6 w-6" />
                      Return to Intelligence Center
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full h-20 rounded-[1.5rem] border-4 font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                >
                  <LogOut className="mr-4 h-6 w-6" />
                  Secure Portal Exit
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.7em]">
            Advancing Knowledge Through Secure Verification
          </p>
        </div>
      </main>
    </div>
  );
}
