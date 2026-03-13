
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, UserPlus, LogIn, CheckCircle2, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useUser, useFirestore, initiateAnonymousSignIn } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, serverTimestamp, limit } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

const ADMIN_CODE = "ADMIN123";
const PURPOSES = [
  "Reading Books",
  "Thesis Research",
  "Computer Use",
  "Assignments",
  "Others"
];

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [idInput, setIdInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPurposeDialog, setShowPurposeDialog] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [currentVisitor, setCurrentVisitor] = useState<any>(null);
  
  // Registration State
  const [regData, setRegData] = useState({ firstName: "", lastName: "", collegeOrOffice: "" });

  // Auto-focus logic for RFID readers
  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
    
    // Initial focus
    inputRef.current?.focus();

    // Re-focus whenever clicking anywhere on the screen (Kiosk Mode)
    const handleGlobalClick = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [user, isUserLoading, auth]);

  const handleKioskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = idInput.trim();
    if (!input || isProcessing) return;

    if (input.toUpperCase() === ADMIN_CODE) {
      router.push("/dashboard");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Try Lookup by ID or Email
      let visitorDoc: any = null;
      
      if (input.includes("@")) {
        const q = query(collection(db, 'students'), where('email', '==', input.toLowerCase()), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) visitorDoc = snap.docs[0];
      } else {
        const docRef = doc(db, 'students', input.toUpperCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) visitorDoc = docSnap;
      }

      if (visitorDoc) {
        const data = visitorDoc.data();
        const visitorId = visitorDoc.id;

        if (data.isBlocked) {
          toast({ variant: "destructive", title: "Access Denied", description: "This visitor has been blocked by the Administrator." });
          setIdInput("");
          setIsProcessing(false);
          return;
        }

        // Check for active session (to handle check-out)
        const activeQ = query(
          collection(db, 'librarySessions'),
          where('studentId', '==', visitorId),
          where('checkOutTime', '==', null)
        );
        const activeSnap = await getDocs(activeQ);

        if (!activeSnap.empty) {
          // CHECK OUT
          const sessionDoc = activeSnap.docs[0];
          updateDocumentNonBlocking(doc(db, 'librarySessions', sessionDoc.id), { checkOutTime: serverTimestamp() });
          toast({ title: "Checked Out", description: `Goodbye, ${data.firstName}! See you again soon.` });
          setIdInput("");
          setIsProcessing(false);
        } else {
          // PREPARE CHECK IN (needs purpose)
          setCurrentVisitor({ ...data, id: visitorId });
          setShowPurposeDialog(true);
          setIsProcessing(false);
        }
      } else {
        // Offer registration
        setIsRegistering(true);
        setIsProcessing(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Database connection failed." });
      setIsProcessing(false);
    }
  };

  const finalizeCheckIn = () => {
    if (!currentVisitor || !selectedPurpose) return;

    const sessionId = `sess_${Date.now()}`;
    addDocumentNonBlocking(collection(db, 'librarySessions'), {
      id: sessionId,
      studentId: currentVisitor.id,
      visitorName: `${currentVisitor.firstName} ${currentVisitor.lastName}`,
      collegeOrOffice: currentVisitor.collegeOrOffice,
      checkInTime: serverTimestamp(),
      checkOutTime: null,
      purpose: selectedPurpose
    });

    toast({ 
      title: "Welcome to NEU Library!", 
      description: `${currentVisitor.firstName} from ${currentVisitor.collegeOrOffice} checked in for ${selectedPurpose}.`,
    });

    setShowPurposeDialog(false);
    setCurrentVisitor(null);
    setSelectedPurpose("");
    setIdInput("");
  };

  const handleRegisterAndCheckIn = () => {
    if (!regData.firstName || !regData.lastName || !regData.collegeOrOffice) return;
    
    const inputId = idInput.trim().toUpperCase();
    const studentRef = doc(db, 'students', inputId);
    const newStudent = {
      ...regData,
      id: inputId,
      email: inputId.includes("@") ? inputId.toLowerCase() : "",
      isBlocked: false,
      createdAt: new Date().toISOString()
    };
    
    setDocumentNonBlocking(studentRef, newStudent, { merge: true });
    setIsRegistering(false);
    setCurrentVisitor(newStudent);
    setShowPurposeDialog(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="max-w-xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-3xl mb-4 shadow-xl">
            <BookOpen className="h-14 w-14" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground font-headline">
            NEU Library <span className="text-primary">Log</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Tap RFID Card or Enter Institutional ID
          </p>
        </div>

        <Card className="glass-card shadow-2xl border-primary/20 p-4">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 text-primary font-bold mb-2">
              <Scan className="h-5 w-5 animate-pulse" />
              RFID Terminal Active
            </div>
            <CardTitle className="text-2xl">Visitor Entry</CardTitle>
            <CardDescription>Place your card near the reader</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKioskSubmit} className="space-y-6">
              <div className="relative">
                <Input 
                  ref={inputRef}
                  placeholder="Scan ID or Type ID/Email"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="h-20 text-3xl text-center font-bold border-2 focus-visible:ring-primary shadow-inner bg-muted/30"
                  autoFocus
                  disabled={isProcessing}
                  autoComplete="off"
                />
                {isProcessing && (
                  <div className="absolute right-4 top-7">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg active:scale-[0.98] transition-all"
                disabled={!idInput.trim() || isProcessing}
              >
                {isProcessing ? "Verifying..." : "Confirm Identification"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="pt-8 opacity-60 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-5 w-5" />
            Secure University Monitoring
          </div>
          <p className="text-xs">University ID / Institutional Email Integration Active</p>
        </div>
      </div>

      {/* Purpose Selection Dialog */}
      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary flex items-center gap-2">
              <LogIn className="h-6 w-6" />
              Purpose of Visit
            </DialogTitle>
            <DialogDescription>
              Welcome, <span className="font-bold">{currentVisitor?.firstName} {currentVisitor?.lastName}</span>! 
              Please specify the reason for your visit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {PURPOSES.map((p) => (
                <Button 
                  key={p} 
                  variant={selectedPurpose === p ? "default" : "outline"}
                  className="h-12 text-lg justify-start px-6 font-semibold"
                  onClick={() => setSelectedPurpose(p)}
                >
                  <CheckCircle2 className={cn("mr-3 h-5 w-5", selectedPurpose === p ? "opacity-100" : "opacity-0")} />
                  {p}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-12 text-lg font-bold" 
              onClick={finalizeCheckIn} 
              disabled={!selectedPurpose}
            >
              Complete Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>First-Time Visitor Detected</DialogTitle>
            <DialogDescription>
              Profile for <span className="font-bold text-primary">{idInput}</span> not found. Please provide your details to register.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={regData.firstName} onChange={(e) => setRegData({...regData, firstName: e.target.value})} placeholder="Jane" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={regData.lastName} onChange={(e) => setRegData({...regData, lastName: e.target.value})} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>College / Office</Label>
              <Input value={regData.collegeOrOffice} onChange={(e) => setRegData({...regData, collegeOrOffice: e.target.value})} placeholder="e.g. College of Computing" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegistering(false)}>Cancel</Button>
            <Button onClick={handleRegisterAndCheckIn} disabled={!regData.firstName || !regData.lastName || !regData.collegeOrOffice}>
              <UserPlus className="mr-2 h-4 w-4" />
              Register & Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
