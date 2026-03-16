"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, LogOut, CheckCircle2, User } from "lucide-react";
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
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-12">
          <div className="inline-flex items-center justify-center p-6 bg-primary text-white rounded-[3rem] shadow-2xl success-pulse">
            <CheckCircle2 className="h-16 w-16" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground font-headline uppercase italic">
              Welcome to <span className="text-primary not-italic">NEU Library!</span>
            </h1>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">
              Visitor Authorization Confirmed
            </p>
          </div>

          <Card className="glass-card border-none rounded-[2.5rem] shadow-2xl p-8 overflow-hidden">
            <CardContent className="p-0 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black uppercase text-foreground">
                    {user?.displayName || "Visitor"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Access Type</p>
                  <p className="text-lg font-black uppercase italic">Student Access</p>
                </div>
                <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Facility Status</p>
                  <p className="text-lg font-black uppercase italic text-cyan-600">Active</p>
                </div>
              </div>

              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full h-14 rounded-2xl border-2 font-black uppercase tracking-widest hover:bg-destructive/5 hover:text-destructive hover:border-destructive transition-all"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-4 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
            <BookOpen className="h-4 w-4" />
            Empowering Minds Through Knowledge
          </div>
        </div>
      </main>
    </div>
  );
}
