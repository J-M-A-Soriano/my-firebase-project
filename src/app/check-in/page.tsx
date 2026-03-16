
"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, BookOpen, GraduationCap, Briefcase, CheckCircle2, 
  Loader2, UserPlus, MousePointer2, UserCheck, 
  CalendarDays, ShieldAlert, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type KioskStep = "IDENTIFY" | "REGISTER" | "INTENT" | "WELCOME" | "BLOCKED";

const INTENT_OPTIONS = [
  { id: "research", name: "Research", icon: Search },
  { id: "individual-study", name: "Individual Study", icon: BookOpen },
  { id: "group-project", name: "Group Project", icon: GraduationCap },
  { id: "borrow-return", name: "Book Borrowing/Return", icon: Briefcase },
  { id: "computer-lab", name: "Computer Lab Use", icon: MousePointer2 },
];

/**
 * @fileOverview Check-In Kiosk - Terminal for institutional access logging.
 * Features real-time security handshake and blocking enforcement.
 */
export default function CheckInKiosk() {
  const { toast } = useToast();
  const db = useFirestore();
  const [step, setStep] = useState<KioskStep>("IDENTIFY");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitor, setVisitor] = useState<any | null>(null);

  // Registration Form State
  const [regType, setRegType] = useState<"Student" | "Teacher" | "Staff">("Student");
  const [regCollege, setRegCollege] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  const collegesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'colleges');
  }, [db]);
  const { data: colleges } = useCollection(collegesQuery);

  useEffect(() => {
    if (step === "WELCOME" || step === "BLOCKED") {
      const timer = setTimeout(() => resetKiosk(), step === "BLOCKED" ? 8000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const resetKiosk = () => {
    setStep("IDENTIFY");
    setIdentifier("");
    setVisitor(null);
    setRegType("Student");
    setRegCollege("");
    setRegFirstName("");
    setRegLastName("");
  };

  const handleIdentification = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!identifier || !db) return;

    setIsLoading(true);
    const normalizedId = identifier.trim().toUpperCase();
    
    try {
      const docRef = doc(db, 'students', normalizedId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // SECURITY HANDSHAKE: TERMINATE ACCESS IF BLOCKED
        if (data.isBlocked) {
          setStep("BLOCKED");
          toast({ 
            title: "Access Denied", 
            description: "Institutional privileges have been suspended. Please see the library administrator.",
            variant: "destructive" 
          });
          return;
        }

        setVisitor({ ...data, id: docSnap.id });
        setStep("INTENT");
      } else {
        setStep("REGISTER");
      }
    } catch (err) {
      toast({ title: "System Error", description: "Identity handshake failed. Check terminal uplink.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !regFirstName || !regLastName || !regCollege) return;

    const normalizedId = identifier.trim().toUpperCase();
    const newProfile = {
      id: normalizedId,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      type: regType || "Student",
      collegeOrOffice: regCollege,
      email: normalizedId.includes("@") ? normalizedId.toLowerCase() : "",
      createdAt: new Date().toISOString(),
      isBlocked: false
    };

    setDocumentNonBlocking(doc(db, 'students', normalizedId), newProfile, { merge: true });
    setVisitor(newProfile);
    setStep("INTENT");
  };

  const handleIntent = (purpose: string) => {
    if (!db) return;

    const logPayload = {
      visitorId: visitor?.id || identifier || "UNKNOWN",
      visitorName: `${visitor?.firstName || ""} ${visitor?.lastName || ""}`.trim() || "Anonymous Visitor",
      visitorType: visitor?.type || "Student",
      collegeOrOffice: visitor?.collegeOrOffice || "General",
      checkInTime: serverTimestamp(),
      purpose: purpose || "General Use"
    };

    addDocumentNonBlocking(collection(db, 'libraryVisits'), logPayload);
    setStep("WELCOME");
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <NavBar />
      <main className="container mx-auto py-10 px-6 max-w-3xl">
        <div className="space-y-10">
          
          <div className="flex justify-center items-center gap-4">
            {(["IDENTIFY", "REGISTER", "INTENT", "WELCOME"] as KioskStep[]).map((s, idx) => {
              if (s === "REGISTER" && step !== "REGISTER") return null;
              if (step === "BLOCKED") return null;
              const isActive = step === s;
              const isPast = ["IDENTIFY", "REGISTER", "INTENT", "WELCOME"].indexOf(step) > idx;
              return (
                <div key={s} className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all duration-500 border-2",
                    isActive ? "step-active border-primary text-[10px]" : isPast ? "bg-accent text-white border-accent text-[10px]" : "bg-white text-muted-foreground border-muted text-[10px]"
                  )}>
                    {idx === 0 ? "1" : idx === 1 && step === "REGISTER" ? "2" : step === "REGISTER" ? idx + 1 : idx}
                  </div>
                  {isActive && <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{s}</span>}
                  {idx < 3 && <div className="h-0.5 w-8 bg-muted rounded-full" />}
                </div>
              );
            })}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            {step === "IDENTIFY" && (
              <Card className="kiosk-card p-10 rounded-[2rem]">
                <div className="text-center space-y-3 mb-10">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-primary leading-none">Access <span className="text-foreground not-italic">Identification</span></h2>
                  <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Institutional ID / RFID Verification</p>
                </div>
                <form onSubmit={handleIdentification} className="space-y-6">
                  <Input 
                    placeholder="Enter ID Number..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-20 text-xl font-black uppercase tracking-widest rounded-2xl border-2 border-muted focus-visible:border-primary px-8 text-center"
                    autoFocus
                  />
                  <Button 
                    disabled={!identifier || isLoading}
                    className="w-full h-16 rounded-2xl bg-primary text-white text-lg font-black uppercase tracking-widest shadow-lg kiosk-button"
                  >
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : "Verify Identity"}
                  </Button>
                </form>
              </Card>
            )}

            {step === "REGISTER" && (
              <Card className="kiosk-card p-10 rounded-[2rem]">
                <div className="flex items-center gap-6 mb-10">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <UserPlus className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Initial <span className="text-primary not-italic">Record</span></h2>
                    <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest opacity-60">New profile detected for {identifier}</p>
                  </div>
                </div>
                <form onSubmit={handleRegistration} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">First Name</Label>
                      <Input value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="h-12 rounded-xl border-2 font-bold px-4" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Last Name</Label>
                      <Input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="h-12 rounded-xl border-2 font-bold px-4" required />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Visitor Classification</Label>
                    <div className="flex gap-2">
                      {["Student", "Teacher", "Staff"].map((type) => (
                        <Button 
                          key={type}
                          type="button" 
                          variant={regType === type ? "default" : "outline"}
                          onClick={() => setRegType(type as any)}
                          className="flex-1 h-12 rounded-xl font-black uppercase text-[9px]"
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Academic Unit</Label>
                    <Select value={regCollege} onValueChange={setRegCollege}>
                      <SelectTrigger className="h-12 rounded-xl border-2 font-black uppercase text-[9px] px-4">
                        <SelectValue placeholder="Select Affiliation" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl p-2">
                        <SelectItem value="CAS" className="font-bold py-2 text-xs">CAS</SelectItem>
                        <SelectItem value="CBA" className="font-bold py-2 text-xs">CBA</SelectItem>
                        <SelectItem value="COE" className="font-bold py-2 text-xs">COE</SelectItem>
                        <SelectItem value="CS" className="font-bold py-2 text-xs">CS</SelectItem>
                        {colleges?.map(c => <SelectItem key={c.id} value={c.name} className="font-bold py-2 text-xs">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-md kiosk-button">
                    Initialize & Proceed
                  </Button>
                </form>
              </Card>
            )}

            {step === "INTENT" && (
              <Card className="kiosk-card p-10 rounded-[2rem]">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Select <span className="text-foreground not-italic">Intent</span></h2>
                    <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest opacity-60">Identity Confirmed: {visitor?.firstName} {visitor?.lastName}</p>
                  </div>
                  <div className="h-12 w-12 bg-accent/20 rounded-2xl flex items-center justify-center border-2 border-accent">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INTENT_OPTIONS.map((intent) => {
                    const Icon = intent.icon;
                    return (
                      <Button
                        key={intent.id}
                        variant="outline"
                        onClick={() => handleIntent(intent.name)}
                        className="h-28 rounded-2xl border-2 border-muted hover:border-primary hover:bg-primary hover:text-white group transition-all duration-300 shadow-sm hover:shadow-xl"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-muted/30 rounded-xl group-hover:bg-white/20 transition-colors">
                            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
                            {intent.name}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            {step === "WELCOME" && (
              <Card className="kiosk-card p-16 text-center space-y-10 success-glow border-4 border-white rounded-[2.5rem]">
                <div className="inline-flex items-center justify-center p-8 bg-primary text-white rounded-[2.5rem] shadow-xl">
                  <CheckCircle2 className="h-16 w-16" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                    Welcome to <br /><span className="text-primary not-italic">NEU Library!</span>
                  </h1>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.6em] opacity-60">Access Transaction Logged</p>
                </div>
                <div className="pt-8 border-t-2 border-dashed border-muted">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Resetting Terminal in 5 Seconds
                  </p>
                </div>
              </Card>
            )}

            {step === "BLOCKED" && (
              <Card className="kiosk-card p-16 text-center space-y-10 border-4 border-destructive rounded-[2.5rem] bg-destructive/5 animate-pulse">
                <div className="inline-flex items-center justify-center p-8 bg-destructive text-white rounded-[2.5rem] shadow-xl">
                  <ShieldAlert className="h-16 w-16" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-destructive">
                    Access <br /><span className="not-italic">Denied</span>
                  </h1>
                  <p className="text-[10px] font-black text-destructive uppercase tracking-[0.4em]">Institutional Privileges Terminated</p>
                </div>
                <div className="pt-8 border-t-2 border-dashed border-destructive/20">
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                    Account flag: Suspended Authority. <br />Please report to the Intelligence Center.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
