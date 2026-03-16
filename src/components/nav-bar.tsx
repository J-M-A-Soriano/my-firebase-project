
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  BookOpen, LayoutDashboard, BrainCircuit, Users, 
  LogOut, ShieldCheck, Settings, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";

/**
 * @fileOverview Institutional Navigation Bar.
 * Provides administrators with direct access to Analytics, Visitors (CRUD), AI Hub, and Settings.
 */
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg group-hover:rotate-3 transition-all duration-500 border-2 border-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black italic uppercase tracking-tighter text-primary leading-none">NEULibrary</span>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] opacity-40">Intelligence Systems</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            {isAdmin && (
              <div className="flex items-center bg-muted/30 p-1 rounded-xl border-2 border-white shadow-inner">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                    pathname === "/dashboard" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <LayoutDashboard className="h-3 w-3" />
                  <span className="hidden md:inline">Analytics</span>
                </Link>
                <Link
                  href="/students"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                    pathname === "/students" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Users className="h-3 w-3" />
                  <span className="hidden md:inline">Visitors</span>
                  <span className="md:hidden">CRUD</span>
                </Link>
                <Link
                  href="/insights"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                    pathname === "/insights" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <BrainCircuit className="h-3 w-3" />
                  <span className="hidden md:inline">AI Hub</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                    pathname === "/admin/settings" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Settings className="h-3 w-3" />
                  <span className="hidden md:inline">Registry</span>
                </Link>
              </div>
            )}

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l-2 border-muted/50">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" />
                      {isAdmin ? 'Admin' : 'Member'}
                    </span>
                    <span className="text-[6px] text-muted-foreground font-black opacity-40 uppercase tracking-[0.2em]">{user.email?.split('@')[0]}</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="h-9 rounded-xl border border-muted hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all px-4 font-black uppercase tracking-widest text-[8px]"
                  >
                    {isLoggingOut ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="mr-1.5 h-3 w-3" />}
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button asChild className="font-black uppercase tracking-widest text-[9px] rounded-xl px-6 h-9 shadow-lg bg-primary flex items-center gap-2">
                  <Link href="/">
                    <ShieldCheck className="h-3 w-3" />
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
