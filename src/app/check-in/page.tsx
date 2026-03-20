"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, BookOpen, GraduationCap, Briefcase, CheckCircle2, 
  Loader2, UserPlus, MousePointer2, UserCheck, 
  ShieldAlert, Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

type KioskStep = "IDENTIFY" | "REGISTER" | "INTENT" | "WELCOME" | "BLOCKED";

const INTENT_OPTIONS = [
  { id: "research", name: "Research", icon: Search },
  { id: "individual-study", name: "Individual Study", icon: BookOpen },
  { id: "group-project", name: "Group Project", icon: GraduationCap },
  { id: "borrow-return", name: "Book Borrowing/Return", icon: Briefcase },
  { id: "computer-lab", name: "Computer Lab Use", icon: MousePointer2 },
];

const ACADEMIC_UNITS = [
  "College of Informatics and Computing Studies (CICS)",
  "College of Engineering and Architecture (CEA)",
  "College of Arts and Sciences (CAS)",
  "College of Business Administration (CBA)",
  "College of Education (CED)",
  "Medical & Health Sciences",
  "Other Specialized Colleges"
];

/**
 * @fileOverview Check-In Hub - Unified terminal for institutional access logging.
 * Optimized: Kiosk-only focus with high-contrast step indicators.
 */
export default function CheckInHub() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  
  const [step, setStep] = useState<KioskStep>("IDENTIFY");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitor, setVisitor] = useState<any | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Registration Form State
  const [regType, setRegType] = useState<"Student" | "Teacher" | "Staff">("Student");
  const [regCollege, setRegCollege] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  const collegesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'colleges');
  }, [db]);
  const { data: dynamicColleges } = useCollection(collegesQuery);

  // AUTHENTICATED HANDSHAKE
  useEffect(() => {
    if (!db || isUserLoading) return;

    const performAuthHandshake = async () => {
      if (user && step === "IDENTIFY") {
        setIsLoading(true);
        try {
          const docRef = doc(db, 'students', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.isBlocked) {
              setStep("BLOCKED");
              return;
            }

            setVisitor({ ...data, id: docSnap.id });
            setStep("INTENT");
          } else {
            const nameParts = (user.displayName || "").split(" ");
            setRegFirstName(nameParts[0] || "");
            setRegLastName(nameParts.slice(1).join(" ") || "");
            setStep("REGISTER");
          }
        } catch (err) {
          console.error("Auth Handshake Error:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    performAuthHandshake();
  }, [user, isUserLoading, db, step]);

  // TIMER LOGIC
  useEffect(() => {
    if (step === "WELCOME" || step === "BLOCKED") {
      setSecondsLeft(5); 

      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null) return 5;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setSecondsLeft(null);
    }
  }, [step]);

  // RESET SIDE EFFECT
  useEffect(() => {
    if ((step === "WELCOME" || step === "BLOCKED") && secondsLeft === 0) {
      signOut(auth).finally(() => {
        router.replace("/");
      });
    }
  }, [secondsLeft, step, auth, router]);

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
        if (data.isBlocked) {
          setStep("BLOCKED");
          return;
        }
        setVisitor({ ...data, id: docSnap.id });
        setStep("INTENT");
      } else {
        setStep("REGISTER");
      }
    } catch (err) {
      toast({ title: "System Error", description: "Identity check failed.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !regFirstName || !regLastName || !regCollege) return;

    const targetId = user?.uid || identifier.trim().toUpperCase();
    const newProfile = {
      id: targetId,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      type: regType || "Student",
      collegeOrOffice: regCollege,
      email: user?.email || "",
      createdAt: new Date().toISOString(),
      isBlocked: false
    };

    setDocumentNonBlocking(doc(db, 'students', targetId), newProfile, { merge: true });
    setVisitor(newProfile);
    setStep("INTENT");
  };

  const handleIntent = (purpose: string) => {
    if (!db) return;

    const logPayload = {
      visitorId: visitor?.id || user?.uid || identifier || "UNKNOWN",
      visitorName: `${visitor?.firstName || ""} ${visitor?.lastName || ""}`.trim() || user?.displayName || "Visitor",
      visitorType: visitor?.type || "Student",
      collegeOrOffice: visitor?.collegeOrOffice || "General",
      checkInTime: serverTimestamp(),
      purpose: purpose || "General Use"
    };

    addDocumentNonBlocking(collection(db, 'libraryVisits'), logPayload);
    setStep("WELCOME");
  };

  const isIdentifyStep = step === "IDENTIFY";

  return (
    <div 
      className={cn(
        "min-h-screen pb-10 transition-all duration-700 relative",
        isIdentifyStep ? "bg-transparent" : "bg-background"
      )}
      style={isIdentifyStep ? {
        backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqSRvIh0BVjYvUYyv9hBfsaE-TMz2IXCvH1A&s')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {isIdentifyStep && (
        <div className="fixed inset-0 bg-primary/70 backdrop-blur-[4px] z-0" />
      )}
      
      <div className="relative z-10">
        <main className="container mx-auto py-10 md:py-20 px-4 md:px-6 max-w-3xl">
          <div className="space-y-8 md:space-y-12">
            
            {/* Context-Aware Step Indicators */}
            <div className="flex justify-center items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2">
              {(["IDENTIFY", "REGISTER", "INTENT", "WELCOME"] as KioskStep[]).map((s, idx) => {
                if (s === "REGISTER" && step !== "REGISTER") return null;
                if (step === "BLOCKED") return null;
                
                const isActive = step === s;
                const isPast = ["IDENTIFY", "REGISTER", "INTENT", "WELCOME"].indexOf(step) > idx;
                
                return (
                  <div key={s} className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className={cn(
                      "h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center font-black transition-all duration-500 border-2",
                      isActive 
                        ? "step-active border-accent text-white shadow-xl scale-110" 
                        : isPast 
                          ? "bg-accent text-white border-accent" 
                          : isIdentifyStep 
                            ? "bg-white/10 text-white/40 border-white/10" 
                            : "bg-muted text-muted-foreground/40 border-muted"
                    )}>
                      {idx === 0 ? "1" : (idx === 1 && step === "REGISTER" ? "2" : (step === "REGISTER" ? idx + 1 : idx))}
                    </div>
                    {isActive && (
                      <span className={cn(
                        "text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] italic whitespace-nowrap transition-colors",
                        isIdentifyStep ? "text-white drop-shadow-lg" : "text-primary"
                      )}>
                        {s}
                      </span>
                    )}
                    {idx < 3 && (
                      <div className={cn(
                        "h-0.5 w-4 md:w-8 rounded-full",
                        isIdentifyStep ? "bg-white/10" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              {step === "IDENTIFY" && (
                <Card className="kiosk-card p-8 md:p-14 rounded-[2.5rem] border-none bg-white shadow-2xl overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="text-center space-y-4 mb-10">
                      <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-primary leading-none">
                        Access <span className="text-accent not-italic">Identification</span>
                      </h2>
                      <p className="text-muted-foreground text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                        Enter ID Number or Verify Account
                      </p>
                    </div>
                    <form onSubmit={handleIdentification} className="space-y-8">
                      <div className="relative group">
                        <Input 
                          placeholder="ENTER ID NUMBER..."
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="h-20 md:h-24 text-xl md:text-3xl font-black uppercase tracking-[0.2em] rounded-[1.5rem] border-4 border-muted focus-visible:border-primary px-8 md:px-10 text-center bg-muted/30 text-primary placeholder:text-primary/20 transition-all"
                          autoFocus
                        />
                        <div className="absolute inset-0 rounded-[1.5rem] border-2 border-primary/5 pointer-events-none group-focus-within:border-primary/20" />
                      </div>
                      <Button 
                        disabled={!identifier || isLoading}
                        className="w-full h-16 md:h-20 rounded-[1.5rem] bg-primary text-white text-lg md:text-xl font-black uppercase tracking-widest shadow-xl kiosk-button hover:bg-[#1a263d] transition-all"
                      >
                        {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : "Verify Identity"}
                      </Button>
                    </form>
                  </div>
                </Card>
              )}

              {step === "REGISTER" && (
                <Card className="kiosk-card p-8 md:p-12 rounded-[2.5rem] border-none bg-white shadow-2xl">
                  <div className="flex items-center gap-6 mb-10">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border-2 border-primary/5">
                      <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-primary">Initial <span className="text-accent not-italic">Record</span></h2>
                      <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest opacity-60">Complete institutional profile</p>
                    </div>
                  </div>
                  <form onSubmit={handleRegistration} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">First Name</Label>
                        <Input value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="h-14 rounded-xl border-2 border-muted font-bold px-5 text-primary focus-visible:border-primary" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Last Name</Label>
                        <Input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="h-14 rounded-xl border-2 border-muted font-bold px-5 text-primary focus-visible:border-primary" required />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Visitor Classification</Label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {["Student", "Teacher", "Staff"].map((type) => (
                          <Button 
                            key={type}
                            type="button" 
                            variant={regType === type ? "default" : "outline"}
                            onClick={() => setRegType(type as any)}
                            className={cn(
                              "flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                              regType === type ? "bg-primary text-white shadow-lg" : "border-2 border-muted text-muted-foreground hover:border-primary"
                            )}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Academic Unit</Label>
                      <Select value={regCollege} onValueChange={setRegCollege}>
                        <SelectTrigger className="h-14 rounded-xl border-2 border-muted font-black uppercase text-[10px] px-5 text-primary focus:border-primary">
                          <SelectValue placeholder="Select Affiliation" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 max-h-[300px]">
                          {ACADEMIC_UNITS.map(unit => (
                            <SelectItem key={unit} value={unit} className="font-bold py-3 text-[10px] uppercase cursor-pointer">
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full h-16 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-xl kiosk-button hover:bg-[#1a263d]">
                      Initialize & Proceed
                    </Button>
                  </form>
                </Card>
              )}

              {step === "INTENT" && (
                <Card className="kiosk-card p-8 md:p-12 rounded-[2.5rem] border-none bg-white shadow-2xl">
                  <div className="flex items-center justify-between mb-10">
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-primary">Select <span className="text-accent not-italic">Intent</span></h2>
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">Access Granted: {visitor?.firstName || user?.displayName}</p>
                    </div>
                    <div className="h-14 w-14 bg-accent/10 rounded-2xl flex items-center justify-center border-2 border-accent/20 shrink-0">
                      <UserCheck className="h-7 w-7 text-accent" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {INTENT_OPTIONS.map((intent) => {
                      const Icon = intent.icon;
                      return (
                        <Button
                          key={intent.id}
                          variant="outline"
                          onClick={() => handleIntent(intent.name)}
                          className="h-28 md:h-32 rounded-[1.5rem] border-2 border-muted hover:border-accent hover:bg-accent/5 group transition-all duration-300 shadow-sm hover:shadow-xl"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-muted/40 rounded-xl group-hover:bg-accent/10 transition-colors">
                              <Icon className="h-7 w-7 text-muted-foreground group-hover:text-accent transition-colors" />
                            </div>
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-primary transition-colors">
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
                <Card className="p-8 md:p-14 text-center space-y-8 border-none bg-primary text-white rounded-[2.5rem] shadow-3xl success-glow">
                  <div className="inline-flex items-center justify-center p-8 md:p-10 bg-white text-primary rounded-[2rem] shadow-2xl">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-tight text-white">
                      Welcome to <br /><span className="text-accent not-italic">NEU Library!</span>
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-black text-white/50 uppercase tracking-[0.5em]">Institutional Entry Logged</p>
                  </div>
                  <div className="pt-4 flex flex-col items-center justify-center gap-2">
                    <p className="text-[14px] font-black uppercase tracking-[0.3em] text-white">
                      Resetting in {secondsLeft ?? 5}s
                    </p>
                  </div>
                </Card>
              )}

              {step === "BLOCKED" && (
                <Card className="p-8 md:p-14 text-center space-y-8 border-none bg-destructive text-white rounded-[2.5rem] shadow-3xl">
                  <div className="inline-flex items-center justify-center p-8 md:p-10 bg-white text-destructive rounded-[2rem] shadow-2xl animate-pulse">
                    <ShieldAlert className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-tight text-white">
                      Access <br /><span className="not-italic">Denied</span>
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-black text-white/50 uppercase tracking-[0.5em]">Authority Terminated</p>
                  </div>
                  <div className="pt-4 flex flex-col items-center justify-center gap-2">
                    <p className="text-[14px] font-black uppercase tracking-[0.3em] text-white">
                      Resetting in {secondsLeft ?? 5}s
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}