
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  BookOpen, LayoutDashboard, BrainCircuit, Users, 
  LogOut, ShieldCheck, Home, Monitor, LayoutTemplate, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { isAdmin } = useAdmin();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
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
    <nav className="sticky top-0 z-50 w-full border-b-4 border-white bg-white/80 backdrop-blur-3xl shadow-sm">
      <div className="container mx-auto px-10 max-w-7xl">
        <div className="flex h-28 items-center justify-between">
          
          <Link href="/" className="flex items-center gap-6 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-primary text-white shadow-2xl group-hover:rotate-6 transition-all duration-500 border-4 border-white">
              <BookOpen className="h-9 w-9" />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">NEULibrary</span>
              <span className="text-[9px] font-black uppercase tracking-[0.6em] opacity-40">Intelligence Systems</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center bg-muted/30 p-2.5 rounded-[2.5rem] border-4 border-white shadow-inner">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-[1.5rem] px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all",
                pathname === "/" ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Home className="h-4 w-4" />
              Portal
            </Link>
            
            <Link
              href="/check-in"
              className={cn(
                "flex items-center gap-3 rounded-[1.5rem] px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all",
                pathname === "/check-in" ? "bg-accent text-white shadow-xl" : "text-muted-foreground hover:text-accent"
              )}
            >
              <Monitor className="h-4 w-4" />
              Terminal
            </Link>

            {isAdmin && (
              <>
                <div className="h-8 w-[2px] bg-muted mx-4" />
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center gap-3 rounded-[1.5rem] px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all",
                    pathname === "/dashboard" ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Analytics
                </Link>
                <Link
                  href="/students"
                  className={cn(
                    "flex items-center gap-3 rounded-[1.5rem] px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all",
                    pathname === "/students" ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Visitors
                </Link>
                <Link
                  href="/insights"
                  className={cn(
                    "flex items-center gap-3 rounded-[1.5rem] px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all",
                    pathname === "/insights" ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <BrainCircuit className="h-4 w-4" />
                  AI Hub
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-8">
            {user ? (
              <div className="flex items-center gap-8 pl-10 border-l-4 border-muted/50">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {isAdmin ? 'System Admin' : 'Academic Member'}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-black opacity-40 uppercase tracking-[0.3em]">{user.email?.split('@')[0]}</span>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" asChild className="h-14 w-14 text-primary hover:bg-primary/10 rounded-2xl border-4 border-white shadow-lg" title="Switch to Greeting View">
                    <Link href="/welcome"><LayoutTemplate className="h-7 w-7" /></Link>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="h-14 w-14 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                >
                  {isLoggingOut ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-7 w-7" />}
                </Button>
              </div>
            ) : (
              <Button asChild className="font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] px-12 h-16 shadow-2xl bg-primary flex items-center gap-3">
                <Link href="/">
                  <ShieldCheck className="h-4 w-4" />
                  Secure Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
