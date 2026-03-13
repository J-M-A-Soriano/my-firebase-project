
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, UserCheck, BrainCircuit, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";

const navItems = [
  { name: "Live Terminal", href: "/", icon: UserCheck },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Visitors", href: "/students", icon: Users },
  { name: "AI Insights", href: "/insights", icon: BrainCircuit },
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
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight tracking-tight text-primary font-headline">NEU Library</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Log System</span>
              </div>
            </Link>
          </div>
          
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md scale-105" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold">Admin Portal</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Authorized</span>
                </div>
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                  {user.email ? user.email.charAt(0).toUpperCase() : "A"}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="font-bold">
                <Link href="/">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
