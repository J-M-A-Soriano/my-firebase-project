"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, Loader2, UserPlus, LogIn, CheckCircle2, Scan, Fingerprint, Info, Mail, ArrowRight } from "lucide-react";
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
  
  const [regData, setRegData] = useState({ firstName: "", lastName: "", collegeOrOffice: "" });

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
    
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

        const activeQ = query(
          collection(db, 'librarySessions'),
          where('studentId', '==', visitorId),
          where('checkOutTime', '==', null)
        );
        const activeSnap = await getDocs(activeQ);

        if (!activeSnap.empty) {
          const sessionDoc = activeSnap.docs[0];
          updateDocumentNonBlocking(doc(db, 'librarySessions', sessionDoc.id), { checkOutTime: serverTimestamp() });
          toast({ title: "Checked Out", description: `Goodbye, ${data.firstName}! Your session has been recorded.` });
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
      collegeOrOffice: currentVisitor.collegeOrOffice || "N/A",
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background selection:bg-primary/20">
      <div className="max-w-2xl w-full space-y-12 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-5 bg-primary text-white rounded-[2rem] shadow-2xl kiosk-glow transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <BookOpen className="h-12 w-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground font-headline uppercase italic">
              NEU <span className="text-primary not-italic">LIBRARY</span> LOG
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">
              Security & Access Control Portal
            </p>
          </div>
        </div>

        {/* Terminal Card */}
        <Card className="glass-card overflow-hidden border-none rounded-[2.5rem] shadow-2xl transform transition-all duration-500 hover:scale-[1.01]">
          <div className="bg-primary p-3 flex items-center justify-between px-8 text-[11px] font-black uppercase tracking-widest text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 animate-pulse" />
              Terminal ID: L-01
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> System Live</span>
              <span className="opacity-50">Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <CardContent className="p-10 space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-black text-foreground">Identification Required</h2>
              <p className="text-muted-foreground font-medium">Please tap your ID card on the reader or enter your email.</p>
            </div>

            <form onSubmit={handleKioskSubmit} className="space-y-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-primary/5 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
                <Input 
                  ref={inputRef}
                  placeholder="SCAN ID CARD"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="h-24 text-4xl text-center font-black border-4 border-muted focus-visible:border-primary focus-visible:ring-0 shadow-inner bg-muted/30 tracking-widest rounded-[1.5rem] uppercase placeholder:text-muted-foreground/20 placeholder:text-2xl transition-all duration-300"
                  autoFocus
                  disabled={isProcessing}
                  autoComplete="off"
                />
                {isProcessing && (
                  <div className="absolute inset-y-0 right-6 flex items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-16 text-xl font-black bg-primary hover:bg-primary/95 text-white shadow-xl active:scale-95 transition-all rounded-[1.25rem] group"
                  disabled={!idInput.trim() || isProcessing}
                >
                  {isProcessing ? "VALIDATING..." : "CONFIRM IDENTITY"}
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Access Points</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
              </div>
            </form>
          </CardContent>

          <div className="bg-muted/30 p-4 border-t border-border/50 flex items-center justify-around">
            <div className="flex items-center gap-2 text-[10px] font-black opacity-60">
              <Scan className="h-4 w-4" /> RFID ACTIVE
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black opacity-60">
              <Mail className="h-4 w-4" /> GOOGLE AUTH
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black opacity-60">
              <ShieldCheck className="h-4 w-4" /> ENCRYPTED
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
            Powered by LibriGuard Intelligence
          </p>
        </div>
      </div>

      {/* Purpose Dialog - Redesigned */}
      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl">
          <div className="bg-primary p-8 text-white space-y-2">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <LogIn className="h-8 w-8" /> Welcome
            </h3>
            <p className="text-primary-foreground/80 font-bold uppercase text-xs tracking-widest">
              Visitor ID: {currentVisitor?.id}
            </p>
            <div className="pt-2">
              <p className="text-2xl font-black">{currentVisitor?.firstName} {currentVisitor?.lastName}</p>
              <p className="text-sm font-medium opacity-70">{currentVisitor?.collegeOrOffice}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block text-center">Select Purpose of Visit</Label>
              <div className="grid grid-cols-1 gap-3">
                {PURPOSES.map((p) => (
                  <Button 
                    key={p} 
                    variant={selectedPurpose === p ? "default" : "outline"}
                    className={cn(
                      "h-14 text-lg justify-start px-8 font-black rounded-[1.25rem] transition-all border-2",
                      selectedPurpose === p ? "bg-primary border-primary scale-[1.02] shadow-xl" : "hover:bg-primary/5 hover:border-primary/20"
                    )}
                    onClick={() => setSelectedPurpose(p)}
                  >
                    <CheckCircle2 className={cn("mr-4 h-6 w-6", selectedPurpose === p ? "opacity-100" : "opacity-0")} />
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <Button 
              className="w-full h-16 text-xl font-black rounded-[1.25rem] shadow-2xl bg-primary hover:bg-primary/95" 
              onClick={finalizeCheckIn} 
              disabled={!selectedPurpose}
            >
              LOG ENTRY & ENTER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog - Redesigned */}
      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent className="rounded-[2.5rem] p-10 shadow-3xl">
          <DialogHeader className="space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <UserPlus className="h-8 w-8" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-3xl font-black italic uppercase">Visitor Registration</DialogTitle>
              <DialogDescription className="text-base font-medium">
                Identity <span className="text-primary font-black underline">{idInput}</span> is not in our system.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">First Name</Label>
                <Input 
                  value={regData.firstName} 
                  onChange={(e) => setRegData({...regData, firstName: e.target.value})} 
                  placeholder="e.g. Maria"
                  className="h-14 rounded-2xl font-bold bg-muted/30 border-none px-6"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Last Name</Label>
                <Input 
                  value={regData.lastName} 
                  onChange={(e) => setRegData({...regData, lastName: e.target.value})} 
                  placeholder="e.g. Santos"
                  className="h-14 rounded-2xl font-bold bg-muted/30 border-none px-6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">College / Office / Department</Label>
              <Input 
                value={regData.collegeOrOffice} 
                onChange={(e) => setRegData({...regData, collegeOrOffice: e.target.value})} 
                placeholder="e.g. College of Education"
                className="h-14 rounded-2xl font-bold bg-muted/30 border-none px-6"
              />
            </div>
            <div className="flex items-start gap-3 p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10">
              <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
              <p className="text-xs font-bold text-primary leading-relaxed uppercase tracking-tighter">
                Registering will enable instant RFID access for all future visits.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              className="w-full h-16 text-xl font-black rounded-[1.25rem] shadow-xl bg-primary hover:bg-primary/95"
              onClick={handleRegisterAndCheckIn} 
              disabled={!regData.firstName || !regData.lastName || !regData.collegeOrOffice}
            >
              COMPLETE REGISTRATION
            </Button>
            <Button variant="ghost" className="w-full h-10 text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100" onClick={() => setIsRegistering(false)}>
              Cancel Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}