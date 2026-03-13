"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, UserCheck, BrainCircuit, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";

const navItems = [
  { name: "Terminal", href: "/", icon: UserCheck },
  { name: "Insights Center", href: "/dashboard", icon: LayoutDashboard },
  { name: "Visitor Hub", href: "/students", icon: Users },
  { name: "AI Analyst", href: "/insights", icon: BrainCircuit },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-2xl">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex h-20 items-center justify-between">
          
          <Link href="/" className="flex items-center gap-4 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl group-hover:rotate-12 transition-transform duration-300">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black italic uppercase tracking-tighter text-primary font-headline leading-none">NEU LOG</span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Library Systems</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center bg-muted/40 p-1.5 rounded-2xl border border-border/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-primary text-white shadow-lg scale-105" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Admin Access</span>
                  <span className="text-[9px] text-muted-foreground font-bold opacity-60">Session Active</span>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black border-2 border-primary/10 shadow-inner">
                  {user.email ? user.email.charAt(0).toUpperCase() : "A"}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="default" className="font-black uppercase tracking-widest text-[10px] rounded-xl px-6 h-10 shadow-lg">
                <Link href="/">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}