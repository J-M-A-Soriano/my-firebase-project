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
    <nav className="sticky top-0 z-50 w-full border-b-2 border-white bg-white/80 backdrop-blur-3xl shadow-sm">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex h-20 items-center justify-between">
          
          <Link href="/" className="flex items-center gap-4 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg group-hover:rotate-3 transition-all duration-500 border-2 border-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black italic uppercase tracking-tighter text-primary leading-none">NEULibrary</span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Intelligence Systems</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center bg-muted/30 p-1.5 rounded-2xl border-2 border-white shadow-inner">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                pathname === "/" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Home className="h-3.5 w-3.5" />
              Portal
            </Link>
            
            <Link
              href="/check-in"
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                pathname === "/check-in" ? "bg-accent text-white shadow-md" : "text-muted-foreground hover:text-accent"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Terminal
            </Link>

            {isAdmin && (
              <>
                <div className="h-6 w-[1.5px] bg-muted mx-2" />
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    pathname === "/dashboard" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Analytics
                </Link>
                <Link
                  href="/students"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    pathname === "/students" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  Visitors
                </Link>
                <Link
                  href="/insights"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    pathname === "/insights" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <BrainCircuit className="h-3.5 w-3.5" />
                  AI Hub
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 pl-6 border-l-2 border-muted/50">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isAdmin ? 'Admin' : 'Member'}
                  </span>
                  <span className="text-[7px] text-muted-foreground font-black opacity-40 uppercase tracking-[0.2em]">{user.email?.split('@')[0]}</span>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl border-2 border-white shadow-md" title="Switch View">
                    <Link href="/welcome"><LayoutTemplate className="h-5 w-5" /></Link>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="h-10 rounded-xl border border-muted hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all px-4 font-black uppercase tracking-widest text-[9px]"
                >
                  {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="mr-1.5 h-3.5 w-3.5" />}
                  Exit
                </Button>
              </div>
            ) : (
              <Button asChild className="font-black uppercase tracking-widest text-[10px] rounded-xl px-8 h-10 shadow-lg bg-primary flex items-center gap-2">
                <Link href="/">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
