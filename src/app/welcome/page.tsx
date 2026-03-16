"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, User, LogOut, Library, ShieldCheck, MapPin } from "lucide-react";
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
          <div className="inline-flex items-center justify-center p-8 bg-primary text-white rounded-[3.5rem] shadow-2xl success-pulse">
            <CheckCircle2 className="h-20 w-20" />
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight text-foreground uppercase italic">
              Welcome to <span className="text-primary not-italic">NEU Library!</span>
            </h1>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em] opacity-60">
              Institutional Visitor Authorization Verified
            </p>
          </div>

          <Card className="glass-card border-none rounded-[3.5rem] shadow-2xl p-12 overflow-hidden bg-white/80">
            <CardContent className="p-0 space-y-12">
              <div className="flex flex-col items-center gap-6">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black uppercase text-foreground italic tracking-tight">
                    {user?.displayName || "Authorized Visitor"}
                  </p>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-white/50 space-y-2">
                  <ShieldCheck className="h-5 w-5 text-primary mx-auto opacity-50" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Status</p>
                  <p className="text-xl font-black uppercase italic text-cyan-600">Active</p>
                </div>
                <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-white/50 space-y-2">
                  <MapPin className="h-5 w-5 text-primary mx-auto opacity-50" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Terminal</p>
                  <p className="text-xl font-black uppercase italic">L-01</p>
                </div>
                <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-white/50 space-y-2">
                  <Library className="h-5 w-5 text-primary mx-auto opacity-50" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Access</p>
                  <p className="text-xl font-black uppercase italic">Standard</p>
                </div>
              </div>

              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white hover:border-destructive transition-all"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Secure Logout
              </Button>
            </CardContent>
          </Card>
          
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">
            Advancing Knowledge Through Secure Access
          </p>
        </div>
      </main>
    </div>
  );
}