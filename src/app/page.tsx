
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, ArrowRight, Loader2, UserCheck, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useUser, useFirestore, initiateAnonymousSignIn } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

const ADMIN_CODE = "ADMIN123";

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [idInput, setIdInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Quick Registration State
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

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

    if (input === ADMIN_CODE) {
      toast({
        title: "Administrative Access",
        description: "Redirecting to management dashboard...",
      });
      router.push("/dashboard");
      return;
    }

    try {
      const studentDoc = await getDoc(doc(db, 'students', input));
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        
        const activeSessionsQuery = query(
          collection(db, 'librarySessions'),
          where('studentId', '==', input),
          where('checkOutTime', '==', null)
        );
        
        const sessionSnapshot = await getDocs(activeSessionsQuery);

        if (!sessionSnapshot.empty) {
          const sessionDoc = sessionSnapshot.docs[0];
          updateDocumentNonBlocking(doc(db, 'librarySessions', sessionDoc.id), {
            checkOutTime: serverTimestamp()
          });
          
          toast({
            title: "Check-out Recorded",
            description: `Goodbye, ${studentData.firstName}! Your session has ended.`,
          });
        } else {
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
        // Offer registration
        setIsRegistering(true);
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

  const handleQuickRegister = () => {
    if (!regFirstName || !regLastName) return;
    
    const studentId = idInput.trim().toUpperCase();
    const studentRef = doc(db, 'students', studentId);
    
    setDocumentNonBlocking(studentRef, {
      id: studentId,
      firstName: regFirstName,
      lastName: regLastName,
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Profile Created",
      description: `Welcome to the library, ${regFirstName}! You can now check in.`,
    });

    setIsRegistering(false);
    setRegFirstName("");
    setRegLastName("");
    // Process the check-in immediately
    const sessionId = `sess_${Date.now()}`;
    addDocumentNonBlocking(collection(db, 'librarySessions'), {
      id: sessionId,
      studentId: studentId,
      firstName: regFirstName,
      lastName: regLastName,
      checkInTime: serverTimestamp(),
      checkOutTime: null
    });
    setIdInput("");
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
            <CardDescription>Enter your Student ID or Admin Code</CardDescription>
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
        </div>
      </div>

      {/* Quick Registration Dialog */}
      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Student Detected</DialogTitle>
            <DialogDescription>
              ID <span className="font-bold text-primary">{idInput.toUpperCase()}</span> is not registered. 
              Please enter your name to create a profile and check in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reg-first">First Name</Label>
              <Input id="reg-first" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="e.g. Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-last">Last Name</Label>
              <Input id="reg-last" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} placeholder="e.g. Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegistering(false)}>Cancel</Button>
            <Button onClick={handleQuickRegister} disabled={!regFirstName || !regLastName}>
              <UserPlus className="mr-2 h-4 w-4" />
              Register & Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
