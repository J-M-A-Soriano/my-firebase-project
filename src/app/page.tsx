"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, UserPlus, LogIn, CheckCircle2, Scan, Fingerprint, Info, Mail, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [mounted, setMounted] = useState(false);
  const [localTime, setLocalTime] = useState("");
  
  const [regData, setRegData] = useState({ firstName: "", lastName: "", collegeOrOffice: "" });

  useEffect(() => {
    setMounted(true);
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
    
    const updateTime = () => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);

    const focusInput = () => inputRef.current?.focus();
    focusInput();

    const handleGlobalClick = () => focusInput();
    window.addEventListener('click', handleGlobalClick);
    
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      clearInterval(timer);
    };
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
          toast({ variant: "destructive", title: "Access Denied", description: "Security Restriction: Profile currently flagged." });
          setIdInput("");
          setIsProcessing(false);
          return;
        }

        const activeQ = query(
          collection(db, 'librarySessions'),
          where('studentId', '==', visitorId),
          where('checkOutTime', '==', null)
        );
        const activeSnap = await getDocs(activeQ);

        if (!activeSnap.empty) {
          const sessionDoc = activeSnap.docs[0];
          updateDocumentNonBlocking(doc(db, 'librarySessions', sessionDoc.id), { checkOutTime: serverTimestamp() });
          toast({ title: "Session Closed", description: `Checkout successful for ${data.firstName}.` });
          setIdInput("");
          setIsProcessing(false);
        } else {
          setCurrentVisitor({ ...data, id: visitorId });
          setShowPurposeDialog(true);
          setIsProcessing(false);
        }
      } else {
        setIsRegistering(true);
        setIsProcessing(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "System Error", description: "Terminal connection interrupted." });
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
      collegeOrOffice: currentVisitor.collegeOrOffice || "GENERAL",
      checkInTime: serverTimestamp(),
      checkOutTime: null,
      purpose: selectedPurpose
    });

    toast({ 
      title: "Authorization Granted", 
      description: `Entry logged for ${currentVisitor.firstName}.`,
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background selection:bg-primary/20">
      <div className="max-w-2xl w-full space-y-12 relative z-10">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-5 bg-primary text-white rounded-[2rem] shadow-2xl kiosk-glow transform -rotate-2">
            <BookOpen className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase italic">
              NEU <span className="text-primary not-italic">LIBRARY</span> LOG
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-60">
              Visitor Authorization Terminal
            </p>
          </div>
        </div>

        <Card className="glass-card overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
          <div className="bg-primary p-3 flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-widest text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Terminal ID: L-01
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> ONLINE</span>
              {mounted && <span className="opacity-50">{localTime}</span>}
            </div>
          </div>

          <CardContent className="p-10 space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Security Checkpoint</h2>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-wide opacity-70">Scan Institutional ID or Input Credentials</p>
            </div>

            <form onSubmit={handleKioskSubmit} className="space-y-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-primary/5 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
                <Input 
                  ref={inputRef}
                  placeholder="AWAITING INPUT..."
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="h-20 text-3xl text-center font-black border-4 border-muted focus-visible:border-primary focus-visible:ring-0 shadow-inner bg-muted/20 tracking-widest rounded-[1.5rem] uppercase placeholder:text-muted-foreground/20 placeholder:text-xl transition-all"
                  autoFocus
                  disabled={isProcessing}
                  autoComplete="off"
                />
                {isProcessing && (
                  <div className="absolute inset-y-0 right-6 flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/95 text-white shadow-xl rounded-[1.25rem] group"
                disabled={!idInput.trim() || isProcessing}
              >
                {isProcessing ? "PROCESSING..." : "VALIDATE IDENTITY"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>

          <div className="bg-muted/30 p-4 border-t border-border/50 flex items-center justify-around">
            <div className="flex items-center gap-2 text-[9px] font-black opacity-40">
              <Scan className="h-3.5 w-3.5" /> RFID ACTIVE
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black opacity-40">
              <Mail className="h-3.5 w-3.5" /> GOOGLE AUTH
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black opacity-40">
              <ShieldCheck className="h-3.5 w-3.5" /> ENCRYPTED
            </div>
          </div>
        </Card>

        <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">
          Enterprise Security Infrastructure by NEU Systems
        </p>
      </div>

      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Verification Successful</DialogTitle>
          </DialogHeader>
          <div className="bg-primary p-8 text-white space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <LogIn className="h-6 w-6" /> Profile Verified
            </h3>
            <div className="pt-2">
              <p className="text-xl font-black">{currentVisitor?.firstName} {currentVisitor?.lastName}</p>
              <p className="text-xs font-medium opacity-60 uppercase tracking-widest">{currentVisitor?.collegeOrOffice}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground block text-center">Activity Selection</Label>
              <div className="grid grid-cols-1 gap-3">
                {PURPOSES.map((p) => (
                  <Button 
                    key={p} 
                    variant={selectedPurpose === p ? "default" : "outline"}
                    className={cn(
                      "h-12 text-md justify-start px-6 font-black rounded-[1rem] border-2",
                      selectedPurpose === p ? "bg-primary border-primary shadow-lg" : "hover:bg-primary/5"
                    )}
                    onClick={() => setSelectedPurpose(p)}
                  >
                    <CheckCircle2 className={cn("mr-3 h-5 w-5", selectedPurpose === p ? "opacity-100" : "opacity-0")} />
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg font-black rounded-[1rem] shadow-xl bg-primary hover:bg-primary/95" 
              onClick={finalizeCheckIn} 
              disabled={!selectedPurpose}
            >
              LOG ENTRY
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent className="rounded-[2.5rem] p-10 shadow-3xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-black italic uppercase text-center">Unregistered Identity</DialogTitle>
            <DialogDescription className="text-center font-bold text-xs uppercase tracking-widest opacity-60">
              Identity <span className="text-primary">{idInput}</span> requires initialization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest opacity-50 px-1">First Name</Label>
                <Input value={regData.firstName} onChange={(e) => setRegData({...regData, firstName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest opacity-50 px-1">Last Name</Label>
                <Input value={regData.lastName} onChange={(e) => setRegData({...regData, lastName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest opacity-50 px-1">Institutional Affiliation</Label>
              <Input value={regData.collegeOrOffice} onChange={(e) => setRegData({...regData, collegeOrOffice: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              className="w-full h-14 font-black rounded-[1rem] shadow-lg bg-primary hover:bg-primary/95"
              onClick={handleRegisterAndCheckIn} 
              disabled={!regData.firstName || !regData.lastName || !regData.collegeOrOffice}
            >
              INITIALIZE PROFILE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
