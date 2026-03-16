
"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, User, LogOut, Library, ShieldCheck, MapPin, Building2 } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-3xl w-full text-center space-y-16">
          <div className="inline-flex items-center justify-center p-10 bg-primary text-white rounded-[4rem] shadow-2xl success-pulse">
            <CheckCircle2 className="h-24 w-24" />
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-foreground uppercase italic leading-none">
              Welcome to <span className="text-primary not-italic">NEU Library!</span>
            </h1>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.5em] opacity-60">
              Institutional Entry Verification Confirmed
            </p>
          </div>

          <Card className="glass-card border-none rounded-[3.5rem] shadow-2xl p-12 overflow-hidden bg-white/90 backdrop-blur-2xl">
            <CardContent className="p-0 space-y-12">
              <div className="flex flex-col items-center gap-6">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-black uppercase text-foreground italic tracking-tight">
                    {user?.displayName || "Verified User"}
                  </p>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-white/50 space-y-2 group hover:bg-primary/5 transition-colors">
                  <ShieldCheck className="h-5 w-5 text-primary mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Vector Status</p>
                  <p className="text-xl font-black uppercase italic text-cyan-600">Authorized</p>
                </div>
                <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-white/50 space-y-2 group hover:bg-primary/5 transition-colors">
                  <MapPin className="h-5 w-5 text-primary mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Active Terminal</p>
                  <p className="text-xl font-black uppercase italic">Main Entry</p>
                </div>
                <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-white/50 space-y-2 group hover:bg-primary/5 transition-colors">
                  <Building2 className="h-5 w-5 text-primary mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Affiliation</p>
                  <p className="text-xl font-black uppercase italic">Institutional</p>
                </div>
              </div>

              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white hover:border-destructive transition-all"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Secure Portal Exit
              </Button>
            </CardContent>
          </Card>
          
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.6em]">
            Advancing Knowledge Through Secure Verification
          </p>
        </div>
      </main>
    </div>
  );
}
