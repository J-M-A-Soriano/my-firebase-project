
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
  CalendarDays, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/use-admin";
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
 */
export default function CheckInHub() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAdmin } = useAdmin();
  
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
  const { data: dynamicColleges } = useCollection(collegesQuery);

  // AUTHENTICATED HANDSHAKE: Automatically identify users logging in via personal accounts
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
            
            // SECURITY CHECK: Terminate if blocked
            if (data.isBlocked) {
              setStep("BLOCKED");
              toast({ title: "Access Denied", description: "Your institutional privileges are suspended.", variant: "destructive" });
              await signOut(auth);
              return;
            }

            setVisitor({ ...data, id: docSnap.id });
            setStep("INTENT");
          } else {
            // New authenticated user: pre-fill registration from Google profile
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
  }, [user, isUserLoading, db, step, auth, toast]);

  // RESET TIMER
  useEffect(() => {
    if (step === "WELCOME" || step === "BLOCKED") {
      const timer = setTimeout(() => {
        if (user && !isAdmin) {
          signOut(auth).then(() => router.replace("/"));
        } else {
          resetKiosk();
        }
      }, step === "BLOCKED" ? 8000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [step, user, isAdmin, auth, router]);

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

  return (
    <div 
      className={cn(
        "min-h-screen pb-10 transition-all duration-700 relative",
        step === "IDENTIFY" ? "bg-transparent" : "bg-background"
      )}
      style={step === "IDENTIFY" ? {
        backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqSRvIh0BVjYvUYyv9hBfsaE-TMz2IXCvH1A&s')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {step === "IDENTIFY" && (
        <div className="fixed inset-0 bg-primary/65 backdrop-blur-[3px] z-0" />
      )}
      
      <div className="relative z-10">
        <NavBar />
        <main className="container mx-auto py-6 md:py-10 px-4 md:px-6 max-w-3xl">
          <div className="space-y-6 md:space-y-10">
            
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
                      isActive ? "step-active border-primary text-[9px] md:text-[10px]" : isPast ? "bg-accent text-white border-accent text-[9px] md:text-[10px]" : "bg-white text-muted-foreground border-muted text-[9px] md:text-[10px]"
                    )}>
                      {idx === 0 ? "1" : idx === 1 && step === "REGISTER" ? "2" : step === "REGISTER" ? idx + 1 : idx}
                    </div>
                    {isActive && <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white italic whitespace-nowrap drop-shadow-md">{s}</span>}
                    {idx < 3 && <div className="h-0.5 w-4 md:w-8 bg-white/20 rounded-full" />}
                  </div>
                );
              })}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
              {step === "IDENTIFY" && (
                <Card className="kiosk-card p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem]">
                  <div className="relative z-10">
                    <div className="text-center space-y-3 mb-8 md:mb-10">
                      <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-primary leading-none">Access <span className="text-accent not-italic">Identification</span></h2>
                      <p className="text-muted-foreground text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Enter ID Number or Connect Account</p>
                    </div>
                    <form onSubmit={handleIdentification} className="space-y-6">
                      <Input 
                        placeholder="Enter ID Number..."
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="h-16 md:h-20 text-lg md:text-xl font-black uppercase tracking-widest rounded-2xl border-2 border-primary/20 focus-visible:border-accent px-6 md:px-8 text-center bg-muted/10 text-primary placeholder:text-muted-foreground/40"
                        autoFocus
                      />
                      <Button 
                        disabled={!identifier || isLoading}
                        className="w-full h-14 md:h-16 rounded-2xl bg-accent text-white text-base md:text-lg font-black uppercase tracking-widest shadow-lg kiosk-button hover:bg-primary transition-all"
                      >
                        {isLoading ? <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin" /> : "Verify Identity"}
                      </Button>
                    </form>
                  </div>
                </Card>
              )}

              {step === "REGISTER" && (
                <Card className="kiosk-card p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem]">
                  <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
                    <div className="h-12 w-12 md:h-14 md:w-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <UserPlus className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Initial <span className="text-primary not-italic">Record</span></h2>
                      <p className="text-muted-foreground text-[7px] md:text-[8px] font-black uppercase tracking-widest opacity-60">Confirm profile details for enrollment</p>
                    </div>
                  </div>
                  <form onSubmit={handleRegistration} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest ml-1">First Name</Label>
                        <Input value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="h-11 rounded-xl border-2 font-bold px-4" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Last Name</Label>
                        <Input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="h-11 rounded-xl border-2 font-bold px-4" required />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Visitor Classification</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {["Student", "Teacher", "Staff"].map((type) => (
                          <Button 
                            key={type}
                            type="button" 
                            variant={regType === type ? "default" : "outline"}
                            onClick={() => setRegType(type as any)}
                            className="flex-1 h-11 rounded-xl font-black uppercase text-[8px] md:text-[9px]"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Academic Unit</Label>
                      <Select value={regCollege} onValueChange={setRegCollege}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black uppercase text-[8px] md:text-[9px] px-4">
                          <SelectValue placeholder="Select Affiliation" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl p-2 max-h-[300px]">
                          {ACADEMIC_UNITS.map(unit => (
                            <SelectItem key={unit} value={unit} className="font-bold py-2 text-[9px] md:text-[10px] uppercase">
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full h-12 md:h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-md kiosk-button">
                      Initialize & Proceed
                    </Button>
                  </form>
                </Card>
              )}

              {step === "INTENT" && (
                <Card className="kiosk-card p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem]">
                  <div className="flex items-center justify-between mb-8 md:mb-10">
                    <div className="space-y-1">
                      <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-primary">Select <span className="text-foreground not-italic">Intent</span></h2>
                      <p className="text-muted-foreground text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60">Identity Confirmed: {visitor?.firstName || user?.displayName}</p>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 bg-accent/20 rounded-2xl flex items-center justify-center border-2 border-accent shrink-0">
                      <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {INTENT_OPTIONS.map((intent) => {
                      const Icon = intent.icon;
                      return (
                        <Button
                          key={intent.id}
                          variant="outline"
                          onClick={() => handleIntent(intent.name)}
                          className="h-24 md:h-28 rounded-2xl border-2 border-muted hover:border-primary hover:bg-primary hover:text-white group transition-all duration-300 shadow-sm hover:shadow-xl"
                        >
                          <div className="flex flex-col items-center gap-2 md:gap-3">
                            <div className="p-2 md:p-3 bg-muted/30 rounded-xl group-hover:bg-white/20 transition-colors">
                              <Icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
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
                <Card className="kiosk-card p-8 md:p-16 text-center space-y-8 md:space-y-10 success-glow border-4 border-white rounded-[2rem] md:rounded-[2.5rem]">
                  <div className="inline-flex items-center justify-center p-6 md:p-8 bg-primary text-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-tight text-primary">
                      Welcome to <br /><span className="not-italic">NEU Library!</span>
                    </h1>
                    <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-60">Access Transaction Logged</p>
                  </div>
                  <div className="pt-6 md:pt-8 border-t-2 border-dashed border-muted">
                    <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                      <CalendarDays className="h-4 w-4" /> Resetting in 5 Seconds
                    </p>
                  </div>
                </Card>
              )}

              {step === "BLOCKED" && (
                <Card className="kiosk-card p-8 md:p-16 text-center space-y-8 md:space-y-10 border-4 border-destructive rounded-[2rem] md:rounded-[2.5rem] bg-destructive/5 animate-pulse">
                  <div className="inline-flex items-center justify-center p-6 md:p-8 bg-destructive text-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
                    <ShieldAlert className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-tight text-destructive">
                      Access <br /><span className="not-italic">Denied</span>
                    </h1>
                    <p className="text-[8px] md:text-[10px] font-black text-destructive uppercase tracking-[0.3em]">Institutional Privileges Terminated</p>
                  </div>
                  <div className="pt-6 md:pt-8 border-t-2 border-dashed border-destructive/20">
                    <p className="text-[9px] md:text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                      Account flag: Suspended Authority. <br />Please report to the Intelligence Center.
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
