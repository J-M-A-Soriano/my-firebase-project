
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, ArrowRight, Loader2, UserCheck, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth, useUser, useFirestore, initiateAnonymousSignIn } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

const ADMIN_CODE = "ADMIN123";

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [idInput, setIdInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-sign in anonymously so the kiosk can perform database lookups
  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = idInput.trim().toUpperCase();
    if (!input || isProcessing) return;

    setIsProcessing(true);

    // 1. Admin Access Check
    if (input === ADMIN_CODE) {
      toast({
        title: "Administrative Access",
        description: "Redirecting to management dashboard...",
      });
      router.push("/dashboard");
      return;
    }

    // 2. Student ID Check
    try {
      const studentDoc = await getDoc(doc(db, 'students', input));
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        
        // Look for an active session (not checked out)
        const activeSessionsQuery = query(
          collection(db, 'librarySessions'),
          where('studentId', '==', input),
          where('checkOutTime', '==', null)
        );
        
        const sessionSnapshot = await getDocs(activeSessionsQuery);

        if (!sessionSnapshot.empty) {
          // Check-out logic
          const sessionDoc = sessionSnapshot.docs[0];
          updateDocumentNonBlocking(doc(db, 'librarySessions', sessionDoc.id), {
            checkOutTime: serverTimestamp()
          });
          
          toast({
            title: "Check-out Recorded",
            description: `Goodbye, ${studentData.firstName}! Your session has ended.`,
          });
        } else {
          // Check-in logic
          const sessionId = `sess_${Date.now()}`;
          addDocumentNonBlocking(collection(db, 'librarySessions'), {
            id: sessionId,
            studentId: input,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            checkInTime: serverTimestamp(),
            checkOutTime: null
          });

          toast({
            title: "Check-in Successful",
            description: `Welcome, ${studentData.firstName}! Access granted.`,
          });
        }
        setIdInput("");
      } else {
        toast({
          variant: "destructive",
          title: "Invalid ID",
          description: "No student profile found for this ID number.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Could not connect to the database. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-background to-background">
      <div className="max-w-xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-headline sm:text-5xl">
            LibriGuard <span className="text-primary">Kiosk</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Please enter your Student ID to check in or out.
          </p>
        </div>

        <Card className="glass-card shadow-2xl border-primary/20">
          <CardHeader>
            <CardTitle>ID Entry</CardTitle>
            <CardDescription>Enter your 5-digit Student ID or Admin Code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input 
                  placeholder="e.g. S1001"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="h-16 text-2xl text-center font-bold tracking-[0.5em] uppercase border-2 focus-visible:ring-primary"
                  autoFocus
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="absolute right-4 top-5">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 transition-all active:scale-95"
                disabled={!idInput.trim() || isProcessing}
              >
                {isProcessing ? "Processing..." : "Confirm Access"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="pt-8 flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security monitored terminal
          </p>
          {isUserLoading && (
            <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Initializing secure session...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
