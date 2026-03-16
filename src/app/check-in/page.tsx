"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, BookOpen, GraduationCap, Briefcase, CheckCircle2, 
  Loader2, UserPlus, MousePointer2, Building2, UserCheck, 
  ChevronRight, CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type KioskStep = "IDENTIFY" | "REGISTER" | "INTENT" | "WELCOME";

const INTENT_OPTIONS = [
  { id: "research", name: "Research", icon: Search },
  { id: "individual-study", name: "Individual Study", icon: BookOpen },
  { id: "group-project", name: "Group Project", icon: GraduationCap },
  { id: "borrow-return", name: "Book Borrowing/Return", icon: Briefcase },
  { id: "computer-lab", name: "Computer Lab Use", icon: MousePointer2 },
];

export default function CheckInKiosk() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [step, setStep] = useState<KioskStep>("IDENTIFY");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitor, setVisitor] = useState<any | null>(null);

  // Registration Form
  const [regType, setRegType] = useState<"Student" | "Staff">("Student");
  const [regCollege, setRegCollege] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  const collegesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'colleges');
  }, [db, user]);
  const { data: colleges } = useCollection(collegesQuery);

  useEffect(() => {
    if (step === "WELCOME") {
      const timer = setTimeout(() => resetKiosk(), 5000);
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
        setVisitor({ ...data, id: docSnap.id });
        setStep("INTENT");
      } else {
        setStep("REGISTER");
      }
    } catch (err) {
      toast({ title: "System Error", description: "Could not verify ID. Please retry.", variant: "destructive" });
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
      firstName: regFirstName,
      lastName: regLastName,
      type: regType,
      collegeOrOffice: regCollege,
      email: normalizedId.includes("@") ? normalizedId.toLowerCase() : "",
      createdAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(db, 'students', normalizedId), newProfile, { merge: true });
    setVisitor(newProfile);
    setStep("INTENT");
  };

  const handleIntent = (purpose: string) => {
    if (!visitor || !db) return;

    addDocumentNonBlocking(collection(db, 'libraryVisits'), {
      visitorId: visitor.id,
      visitorName: `${visitor.firstName} ${visitor.lastName}`,
      visitorType: visitor.type,
      collegeOrOffice: visitor.collegeOrOffice,
      checkInTime: serverTimestamp(),
      purpose: purpose
    });

    setStep("WELCOME");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <NavBar />
      <main className="container mx-auto py-16 px-6 max-w-4xl">
        <div className="space-y-16">
          
          {/* Step Indicators */}
          <div className="flex justify-center items-center gap-6">
            {(["IDENTIFY", "REGISTER", "INTENT", "WELCOME"] as KioskStep[]).map((s, idx) => {
              if (s === "REGISTER" && step !== "REGISTER") return null;
              const isActive = step === s;
              const isPast = ["IDENTIFY", "REGISTER", "INTENT", "WELCOME"].indexOf(step) > idx;
              return (
                <div key={s} className="flex items-center gap-6">
                  <div className={cn(
                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black transition-all duration-500 border-4",
                    isActive ? "step-active border-primary" : isPast ? "bg-accent text-accent-foreground border-accent" : "bg-white text-muted-foreground border-muted"
                  )}>
                    {idx + 1}
                  </div>
                  {isActive && <span className="text-xs font-black uppercase tracking-widest text-primary italic">{s}</span>}
                  {idx < 3 && <div className="h-1 w-12 bg-muted rounded-full" />}
                </div>
              );
            })}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-12 duration-700">
            {step === "IDENTIFY" && (
              <Card className="kiosk-card p-16">
                <div className="text-center space-y-6 mb-16">
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter">Enter <span className="text-primary not-italic">Identity</span></h2>
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.4em] opacity-60">Student ID or Institutional Email</p>
                </div>
                <form onSubmit={handleIdentification} className="space-y-10">
                  <Input 
                    placeholder="e.g. 2023-100456"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-28 text-3xl font-black uppercase tracking-widest rounded-[2.5rem] border-4 border-muted focus-visible:border-primary pl-12 text-center"
                    autoFocus
                  />
                  <Button 
                    disabled={!identifier || isLoading}
                    className="w-full h-24 rounded-[2.5rem] bg-primary text-white text-2xl font-black uppercase tracking-widest shadow-2xl kiosk-button"
                  >
                    {isLoading ? <Loader2 className="h-12 w-12 animate-spin" /> : "Verify Identity"}
                  </Button>
                </form>
              </Card>
            )}

            {step === "REGISTER" && (
              <Card className="kiosk-card p-16">
                <div className="flex items-center gap-8 mb-16">
                  <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                    <UserPlus className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Initial <span className="text-primary not-italic">Record</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">Building Profile for {identifier}</p>
                  </div>
                </div>
                <form onSubmit={handleRegistration} className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-2">First Name</Label>
                      <Input value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="h-16 rounded-2xl border-2 font-bold px-6" required />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Last Name</Label>
                      <Input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="h-16 rounded-2xl border-2 font-bold px-6" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Visitor Class</Label>
                      <div className="flex gap-4">
                        <Button 
                          type="button" 
                          variant={regType === "Student" ? "default" : "outline"}
                          onClick={() => setRegType("Student")}
                          className="flex-1 h-16 rounded-2xl font-black uppercase text-xs"
                        >
                          <GraduationCap className="mr-3 h-5 w-5" /> Student
                        </Button>
                        <Button 
                          type="button" 
                          variant={regType === "Staff" ? "default" : "outline"}
                          onClick={() => setRegType("Staff")}
                          className="flex-1 h-16 rounded-2xl font-black uppercase text-xs"
                        >
                          <Briefcase className="mr-3 h-5 w-5" /> Staff
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-2">College/Affiliation</Label>
                      <Select value={regCollege} onValueChange={setRegCollege}>
                        <SelectTrigger className="h-16 rounded-2xl border-2 font-black uppercase text-xs px-6">
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-4">
                          <SelectItem value="CAS" className="font-bold py-3">College of Arts & Sciences</SelectItem>
                          <SelectItem value="CBA" className="font-bold py-3">College of Business Admin</SelectItem>
                          <SelectItem value="CED" className="font-bold py-3">College of Education</SelectItem>
                          <SelectItem value="COE" className="font-bold py-3">College of Engineering</SelectItem>
                          <SelectItem value="CS" className="font-bold py-3">College of Computer Studies</SelectItem>
                          {colleges?.map(c => <SelectItem key={c.id} value={c.name} className="font-bold py-3">{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest shadow-xl kiosk-button">
                    Initialize & Proceed <ChevronRight className="ml-3 h-6 w-6" />
                  </Button>
                </form>
              </Card>
            )}

            {step === "INTENT" && (
              <Card className="kiosk-card p-16">
                <div className="flex items-center justify-between mb-16">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Select <span className="text-primary not-italic">Intent</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">Identity Confirmed: {visitor?.firstName} {visitor?.lastName}</p>
                  </div>
                  <div className="h-20 w-20 bg-accent/20 rounded-[2rem] flex items-center justify-center border-4 border-accent">
                    <UserCheck className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {INTENT_OPTIONS.map((intent) => {
                    const Icon = intent.icon;
                    return (
                      <Button
                        key={intent.id}
                        variant="outline"
                        onClick={() => handleIntent(intent.name)}
                        className="h-36 rounded-[2.5rem] border-4 border-muted hover:border-primary hover:bg-primary/5 group transition-all duration-300"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <Icon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-black uppercase tracking-widest">{intent.name}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            {step === "WELCOME" && (
              <Card className="kiosk-card p-24 text-center space-y-16 success-glow border-[12px] border-white">
                <div className="inline-flex items-center justify-center p-16 bg-primary text-white rounded-[4rem] shadow-2xl">
                  <CheckCircle2 className="h-32 w-32" />
                </div>
                <div className="space-y-6">
                  <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-none">
                    Welcome to <br /><span className="text-primary not-italic">NEU Library!</span>
                  </h1>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.8em] opacity-60">Institutional Entry Logged</p>
                </div>
                <div className="pt-12 border-t-4 border-dashed border-muted">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-3">
                    <CalendarDays className="h-5 w-5" /> System Resets in 5 Seconds
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
