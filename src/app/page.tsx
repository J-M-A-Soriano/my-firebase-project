
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, UserPlus, LogIn, CheckCircle2, Scan, Fingerprint, Info } from "lucide-react";
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
    
    // Maintain focus on the input for hardware RFID readers
    const focusInput = () => inputRef.current?.focus();
    focusInput();

    const handleGlobalClick = () => focusInput();
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
      collegeOrOffice: currentVisitor.collegeOrOffice || "N/A", // Fixed: Ensure no undefined value
      checkInTime: serverTimestamp(),
      checkOutTime: null,
      purpose: selectedPurpose
    });

    toast({ 
      title: "Welcome to NEU Library!", 
      description: `${currentVisitor.firstName} from ${currentVisitor.collegeOrOffice || "N/A"} checked in for ${selectedPurpose}.`,
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background overflow-hidden">
      <div className="max-w-xl w-full space-y-6 text-center relative">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />

        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-2xl mb-2 shadow-xl ring-4 ring-primary/10">
            <BookOpen className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground font-headline">
            NEU LIBRARY <span className="text-primary">LOG</span>
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Electronic Access Control & Visitor Monitoring
          </p>
        </div>

        <Card className="glass-card shadow-xl border-primary/20 overflow-hidden">
          <div className="bg-primary/5 p-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary border-b">
            <Fingerprint className="h-3 w-3 animate-pulse" />
            RFID Reader Terminal Active
          </div>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xl">Tap ID Card to Start</CardTitle>
            <CardDescription className="text-sm">Place card near the reader to identify yourself</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleKioskSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-xl -m-1 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Input 
                  ref={inputRef}
                  placeholder="--- SCAN ID ---"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="h-20 text-3xl text-center font-black border-2 border-dashed border-primary/20 focus-visible:border-primary focus-visible:ring-0 shadow-inner bg-muted/20 tracking-tighter rounded-xl uppercase placeholder:text-muted-foreground/30 placeholder:text-xl"
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
              
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 text-muted-foreground w-full">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">or enter institutional email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 shadow-lg active:scale-[0.98] transition-all rounded-xl"
                  disabled={!idInput.trim() || isProcessing}
                >
                  {isProcessing ? "VALIDATING..." : "CONFIRM IDENTIFICATION"}
                </Button>
              </div>
            </form>
          </CardContent>
          <div className="p-3 bg-muted/30 border-t flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <Scan className="h-3 w-3" />
              RFID READY
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <LogIn className="h-3 w-3" />
              GOOGLE AUTH
            </div>
          </div>
        </Card>

        <div className="pt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent-foreground rounded-full text-[10px] font-bold border border-accent/20">
            <ShieldCheck className="h-3 w-3" />
            SECURE CAMPUS MONITORING
          </div>
          <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground opacity-50">
            Authorized Personnel Only
          </p>
        </div>
      </div>

      {/* Purpose Selection Dialog */}
      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-primary/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-primary flex items-center gap-2">
              <LogIn className="h-6 w-6" />
              VISIT PURPOSE
            </DialogTitle>
            <DialogDescription className="text-sm">
              Welcome to <span className="font-bold text-foreground">NEU Library</span>, 
              <span className="block font-bold text-primary mt-0.5">{currentVisitor?.firstName} {currentVisitor?.lastName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 block text-center">Select Activity</Label>
            <div className="grid grid-cols-1 gap-2">
              {PURPOSES.map((p) => (
                <Button 
                  key={p} 
                  variant={selectedPurpose === p ? "default" : "outline"}
                  className={cn(
                    "h-12 text-base justify-start px-6 font-bold rounded-xl transition-all",
                    selectedPurpose === p ? "ring-2 ring-primary/20 scale-[1.01]" : "hover:bg-primary/5"
                  )}
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
              className="w-full h-12 text-lg font-black rounded-xl shadow-lg" 
              onClick={finalizeCheckIn} 
              disabled={!selectedPurpose}
            >
              COMPLETE CHECK-IN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent className="rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">NEW VISITOR PROFILE</DialogTitle>
            <DialogDescription className="text-sm">
              ID <span className="font-bold text-primary">{idInput}</span> not found. Please register.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">First Name</Label>
                <Input 
                  value={regData.firstName} 
                  onChange={(e) => setRegData({...regData, firstName: e.target.value})} 
                  placeholder="Maria"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Last Name</Label>
                <Input 
                  value={regData.lastName} 
                  onChange={(e) => setRegData({...regData, lastName: e.target.value})} 
                  placeholder="Santos"
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">College / Department / Office</Label>
              <Input 
                value={regData.collegeOrOffice} 
                onChange={(e) => setRegData({...regData, collegeOrOffice: e.target.value})} 
                placeholder="College of Engineering"
                className="h-10 rounded-lg"
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl text-[10px] font-medium text-primary">
              <Info className="h-4 w-4 shrink-0" />
              <p>Your ID will be saved for future one-tap access.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="h-10 text-xs font-bold" onClick={() => setIsRegistering(false)}>Cancel</Button>
            <Button 
              className="h-10 px-6 font-black rounded-lg text-sm"
              onClick={handleRegisterAndCheckIn} 
              disabled={!regData.firstName || !regData.lastName || !regData.collegeOrOffice}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              REGISTER & CONTINUE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
