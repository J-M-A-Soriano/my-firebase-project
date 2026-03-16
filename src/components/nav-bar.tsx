"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, UserCheck, BrainCircuit, Users, LogOut, ShieldCheck, Settings, Home, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";

const navItems = [
  { name: "Terminal", href: "/check-in", icon: UserCheck, adminOnly: false },
  { name: "Intelligence", href: "/dashboard", icon: LayoutDashboard, adminOnly: true },
  { name: "Visitors", href: "/students", icon: Users, adminOnly: true },
  { name: "AI Hub", href: "/insights", icon: BrainCircuit, adminOnly: true },
  { name: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { isAdmin } = useAdmin();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
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
              <span className="text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">LibriGuard</span>
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              if (item.adminOnly && !isAdmin) return null;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[1.5rem] px-10 py-4 text-[11px] font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-primary text-white shadow-xl scale-105" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
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
                  className="h-14 w-14 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                >
                  <LogOut className="h-7 w-7" />
                </Button>
              </div>
            ) : (
              <Button asChild className="font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] px-12 h-16 shadow-2xl bg-primary">
                <Link href="/">Secure Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
