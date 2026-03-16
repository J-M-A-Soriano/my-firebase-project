
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, UserCheck, BrainCircuit, Users, LogOut, ShieldAlert, ShieldCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";

const navItems = [
  { name: "Entry Terminal", href: "/check-in", icon: UserCheck, adminOnly: true },
  { name: "Intelligence Hub", href: "/dashboard", icon: LayoutDashboard, adminOnly: true },
  { name: "Visitor Hub", href: "/students", icon: Users, adminOnly: true },
  { name: "AI Analytics", href: "/insights", icon: BrainCircuit, adminOnly: true },
  { name: "System Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
];

/**
 * @fileOverview Navigation controller with administrative authority checks.
 */
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
    <nav className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-3xl shadow-sm">
      <div className="container mx-auto px-10 max-w-7xl">
        <div className="flex h-24 items-center justify-between">
          
          <Link href="/" className="flex items-center gap-6 group">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-primary text-white shadow-2xl group-hover:rotate-6 transition-all duration-500">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black italic uppercase tracking-tighter text-primary leading-none">NEU LOG</span>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Intelligence Systems</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center bg-muted/40 p-2 rounded-[2rem] border-2 border-white shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              if (item.adminOnly && !isAdmin) return null;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[1.25rem] px-8 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-primary text-white shadow-xl scale-105" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50"
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
              <div className="flex items-center gap-8 pl-8 border-l-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    {isAdmin ? 'System Administrator' : 'Authorized Visitor'}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-black opacity-40 uppercase tracking-[0.2em]">Institutional ID: {user.email?.split('@')[0]}</span>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" asChild className="h-12 w-12 text-primary hover:bg-primary/10 rounded-2xl border-2 border-primary/5 hover:border-primary/20" title="Switch to Regular Access View">
                    <Link href="/welcome"><ShieldAlert className="h-6 w-6" /></Link>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                  title="Secure Portal Exit"
                >
                  <LogOut className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="default" className="font-black uppercase tracking-widest text-[11px] rounded-2xl px-10 h-14 shadow-2xl">
                <Link href="/">Secure Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
