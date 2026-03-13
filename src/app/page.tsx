
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background overflow-hidden">
      <div className="max-w-2xl w-full space-y-10 text-center relative">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />

        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-5 bg-primary text-primary-foreground rounded-[2rem] mb-2 shadow-2xl ring-8 ring-primary/10">
            <BookOpen className="h-16 w-16" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-foreground font-headline">
            NEU LIBRARY <span className="text-primary">LOG</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Electronic Access Control & Visitor Monitoring
          </p>
        </div>

        <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
          <div className="bg-primary/5 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary border-b">
            <Fingerprint className="h-4 w-4 animate-pulse" />
            RFID Reader Terminal Active
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">Please Tap ID Card</CardTitle>
            <CardDescription className="text-lg">Place card near the reader to identify yourself</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleKioskSubmit} className="space-y-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl -m-2 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Input 
                  ref={inputRef}
                  placeholder="--- SCAN ID NOW ---"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="h-28 text-5xl text-center font-black border-4 border-dashed border-primary/20 focus-visible:border-primary focus-visible:ring-0 shadow-inner bg-muted/20 tracking-tighter rounded-2xl uppercase placeholder:text-muted-foreground/30 placeholder:text-3xl"
                  autoFocus
                  disabled={isProcessing}
                  autoComplete="off"
                />
                {isProcessing && (
                  <div className="absolute right-6 top-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="h-px w-12 bg-border" />
                  <span className="text-sm font-bold uppercase tracking-widest">or manually enter email</span>
                  <div className="h-px w-12 bg-border" />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-20 text-2xl font-black bg-primary hover:bg-primary/90 shadow-[0_10px_30px_rgba(0,0,0,0.15)] active:scale-[0.97] transition-all rounded-2xl"
                  disabled={!idInput.trim() || isProcessing}
                >
                  {isProcessing ? "VALIDATING..." : "CONFIRM IDENTIFICATION"}
                </Button>
              </div>
            </form>
          </CardContent>
          <div className="p-4 bg-muted/30 border-t flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Scan className="h-4 w-4" />
              RFID COMPATIBLE
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <LogIn className="h-4 w-4" />
              GOOGLE AUTH
            </div>
          </div>
        </Card>

        <div className="pt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent-foreground rounded-full text-xs font-bold border border-accent/20">
            <ShieldCheck className="h-4 w-4" />
            SECURE CAMPUS MONITORING SYSTEM
          </div>
          <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-50">
            Authorized Personnel Only • IP Logged
          </p>
        </div>
      </div>

      {/* Purpose Selection Dialog */}
      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-primary/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-primary flex items-center gap-3">
              <LogIn className="h-8 w-8" />
              VISIT PURPOSE
            </DialogTitle>
            <DialogDescription className="text-lg">
              Welcome to <span className="font-black text-foreground">NEU Library</span>, 
              <span className="block font-bold text-primary mt-1">{currentVisitor?.firstName} {currentVisitor?.lastName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest opacity-50 mb-2 block text-center">Select Activity</Label>
            <div className="grid grid-cols-1 gap-3">
              {PURPOSES.map((p) => (
                <Button 
                  key={p} 
                  variant={selectedPurpose === p ? "default" : "outline"}
                  className={cn(
                    "h-16 text-xl justify-start px-8 font-bold rounded-2xl transition-all",
                    selectedPurpose === p ? "ring-4 ring-primary/20 scale-[1.02]" : "hover:bg-primary/5"
                  )}
                  onClick={() => setSelectedPurpose(p)}
                >
                  <CheckCircle2 className={cn("mr-4 h-6 w-6", selectedPurpose === p ? "opacity-100" : "opacity-0")} />
                  {p}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-16 text-xl font-black rounded-2xl shadow-xl" 
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
        <DialogContent className="rounded-[2rem] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">NEW VISITOR PROFILE</DialogTitle>
            <DialogDescription className="text-lg">
              ID <span className="font-bold text-primary">{idInput}</span> not found. Please register your details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">First Name</Label>
                <Input 
                  value={regData.firstName} 
                  onChange={(e) => setRegData({...regData, firstName: e.target.value})} 
                  placeholder="e.g. Maria"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Last Name</Label>
                <Input 
                  value={regData.lastName} 
                  onChange={(e) => setRegData({...regData, lastName: e.target.value})} 
                  placeholder="e.g. Santos"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">College / Department / Office</Label>
              <Input 
                value={regData.collegeOrOffice} 
                onChange={(e) => setRegData({...regData, collegeOrOffice: e.target.value})} 
                placeholder="e.g. College of Engineering"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl text-xs font-medium text-primary">
              <Info className="h-5 w-5 shrink-0" />
              <p>Your ID will be saved to the database for future one-tap access. Ensure information matches your institutional records.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="h-12 font-bold" onClick={() => setIsRegistering(false)}>Cancel</Button>
            <Button 
              className="h-12 px-8 font-black rounded-xl"
              onClick={handleRegisterAndCheckIn} 
              disabled={!regData.firstName || !regData.lastName || !regData.collegeOrOffice}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              REGISTER & CONTINUE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
