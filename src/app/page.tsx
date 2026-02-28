
"use client";

import Link from "next/link";
import { BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-background to-background">
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground font-headline sm:text-6xl">
            Secure Library <span className="text-primary">Management</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            LibriGuard helps school libraries track student occupancy, manage access, and gain valuable insights into usage patterns.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <Card className="glass-card hover:border-primary/50 transition-all duration-300">
            <CardContent className="p-8 space-y-6 flex flex-col justify-between h-full">
              <div className="text-left space-y-4">
                <div className="p-2 w-fit bg-accent/20 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold font-headline">Staff Entrance</h3>
                <p className="text-muted-foreground">
                  Access the administrative dashboard to manage check-ins, view real-time occupancy, and generate AI insights.
                </p>
              </div>
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
                <Link href="/dashboard" className="flex items-center gap-2">
                  Enter Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-transparent border-2 border-muted-foreground/20">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 h-full">
              <div className="p-3 bg-secondary rounded-full">
                <BookOpen className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold opacity-60">Student Self Check-in</h3>
              <p className="text-sm text-muted-foreground italic">
                Kiosk mode currently available at library entrance terminals only.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security enforced by Campus SSO
          </p>
        </div>
      </div>
    </div>
  );
}
