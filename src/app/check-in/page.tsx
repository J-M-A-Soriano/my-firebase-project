"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, XCircle, Loader2, BookOpen, GraduationCap, Briefcase, CheckCircle2, ArrowRight, UserPlus, Building2, MousePointer2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Step = "IDENTIFY" | "REGISTER" | "INTENT" | "WELCOME";

const INTENT_OPTIONS = [
  { id: "research", name: "Research", icon: Search },
  { id: "individual-study", name: "Individual Study", icon: BookOpen },
  { id: "group-project", name: "Group Project", icon: GraduationCap },
  { id: "borrow-return", name: "Book Borrowing/Return", icon: Briefcase },
  { id: "computer-lab", name: "Computer Lab Use", icon: MousePointer2 },
];

export default function CheckInPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<Step>("IDENTIFY");
  const [identifier, setIdentifier] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any | null>(null);

  // Registration State
  const [regType, setRegType] = useState<"Student" | "Staff">("Student");
  const [regCollege, setRegCollege] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  // Intent State
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const collegesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'colleges');
  }, [db, user]);
  const { data: colleges } = useCollection(collegesQuery);

  // Auto-reset after welcome
  useEffect(() => {
    if (currentStep === "WELCOME") {
      const timer = setTimeout(() => {
        resetKiosk();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const resetKiosk = () => {
    setCurrentStep("IDENTIFY");
    setIdentifier("");
    setFoundStudent(null);
    setSelectedIntent(null);
    setRegType("Student");
    setRegCollege("");
    setRegFirstName("");
    setRegLastName("");
  };

  const handleIdentification = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!identifier || !db) return;

    setIsSearching(true);
    const normalizedId = identifier.trim().toUpperCase();
    
    try {
      const studentDoc = await getDoc(doc(db, 'students', normalizedId));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setFoundStudent({ ...data, id: studentDoc.id });
        setCurrentStep("INTENT");
      } else {
        setCurrentStep("REGISTER");
      }
    } catch (err) {
      toast({ title: "System Error", description: "Verification handshake failed.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !regFirstName || !regLastName || !regCollege) return;

    const normalizedId = identifier.trim().toUpperCase();
    const newStudent = {
      id: normalizedId,
      firstName: regFirstName,
      lastName: regLastName,
      type: regType,
      collegeOrOffice: regCollege,
      email: normalizedId.includes("@") ? normalizedId.toLowerCase() : "",
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(db, 'students', normalizedId), newStudent, { merge: true });
    setFoundStudent(newStudent);
    setCurrentStep("INTENT");
  };

  const handleIntentSelection = (intent: string) => {
    if (!foundStudent || !db) return;

    addDocumentNonBlocking(collection(db, 'libraryVisits'), {
      visitorId: foundStudent.id,
      visitorName: `${foundStudent.firstName} ${foundStudent.lastName}`,
      visitorType: foundStudent.type,
      collegeOrOffice: foundStudent.collegeOrOffice,
      checkInTime: serverTimestamp(),
      purpose: intent
    });

    setCurrentStep("WELCOME");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="space-y-12">
          {/* Progress Header */}
          <div className="flex justify-center items-center gap-4">
            {(["IDENTIFY", "REGISTER", "INTENT", "WELCOME"] as Step[]).map((s, i) => {
              if (s === "REGISTER" && currentStep !== "REGISTER") return null;
              const isActive = currentStep === s;
              return (
                <div key={s} className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-all border-4",
                    isActive ? "bg-primary text-white border-primary shadow-xl scale-110" : "bg-muted/40 text-muted-foreground border-transparent"
                  )}>
                    {i + 1}
                  </div>
                  {isActive && <span className="text-xs font-black uppercase tracking-widest text-primary italic">{s}</span>}
                  {i < 3 && <div className="h-1 w-8 bg-muted rounded-full" />}
                </div>
              );
            })}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {currentStep === "IDENTIFY" && (
              <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden p-12">
                <div className="text-center space-y-4 mb-12">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">System <span className="text-primary not-italic">Identification</span></h2>
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em] opacity-60">Enter Student ID or Institutional Email</p>
                </div>
                <form onSubmit={handleIdentification} className="space-y-8">
                  <div className="relative">
                    <Input 
                      placeholder="e.g. 2023-100456 or name@neu.edu.ph"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-24 text-2xl font-black uppercase tracking-widest rounded-[2rem] border-4 border-muted focus-visible:border-primary pl-10"
                      autoFocus
                    />
                  </div>
                  <Button 
                    disabled={!identifier || isSearching}
                    className="w-full h-20 rounded-[2rem] bg-primary text-white text-xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
                  >
                    {isSearching ? <Loader2 className="h-10 w-10 animate-spin" /> : "Verify Identity"}
                  </Button>
                </form>
              </Card>
            )}

            {currentStep === "REGISTER" && (
              <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden p-12">
                <div className="flex items-center gap-6 mb-12">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">New <span className="text-primary not-italic">Visitor</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">Initialize institutional profile for {identifier}</p>
                  </div>
                </div>
                <form onSubmit={handleRegistration} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">First Name</Label>
                      <Input value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="h-14 rounded-xl border-2 font-bold" required />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Last Name</Label>
                      <Input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="h-14 rounded-xl border-2 font-bold" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Visitor Class</Label>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant={regType === "Student" ? "default" : "outline"}
                          onClick={() => setRegType("Student")}
                          className="flex-1 h-14 rounded-xl font-black uppercase text-[10px]"
                        >
                          <GraduationCap className="mr-2 h-4 w-4" /> Student
                        </Button>
                        <Button 
                          type="button" 
                          variant={regType === "Staff" ? "default" : "outline"}
                          onClick={() => setRegType("Staff")}
                          className="flex-1 h-14 rounded-xl font-black uppercase text-[10px]"
                        >
                          <Briefcase className="mr-2 h-4 w-4" /> Staff/Teacher
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">College/Office</Label>
                      <Select value={regCollege} onValueChange={setRegCollege}>
                        <SelectTrigger className="h-14 rounded-xl border-2 font-black uppercase text-[10px]">
                          <SelectValue placeholder="Select Academic Unit" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="CAS" className="font-bold">College of Arts & Sciences</SelectItem>
                          <SelectItem value="CBA" className="font-bold">College of Business Admin</SelectItem>
                          <SelectItem value="CED" className="font-bold">College of Education</SelectItem>
                          <SelectItem value="COE" className="font-bold">College of Engineering</SelectItem>
                          <SelectItem value="CS" className="font-bold">College of Computer Studies</SelectItem>
                          {colleges?.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl">
                    Create Profile & Proceed
                  </Button>
                </form>
              </Card>
            )}

            {currentStep === "INTENT" && (
              <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Select <span className="text-primary not-italic">Activity</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">Verified: {foundStudent?.firstName} {foundStudent?.lastName}</p>
                  </div>
                  <Badge className="bg-primary/5 text-primary border-none px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">{foundStudent?.type}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {INTENT_OPTIONS.map((intent) => {
                    const Icon = intent.icon;
                    return (
                      <Button
                        key={intent.id}
                        variant="outline"
                        onClick={() => handleIntentSelection(intent.name)}
                        className="h-32 rounded-[2rem] border-4 border-muted hover:border-primary hover:bg-primary/5 group transition-all"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-xs font-black uppercase tracking-widest">{intent.name}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            {currentStep === "WELCOME" && (
              <Card className="rounded-[4rem] border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-white overflow-hidden p-20 text-center space-y-12 success-pulse border-8 border-white">
                <div className="inline-flex items-center justify-center p-12 bg-primary text-white rounded-[3rem] shadow-2xl">
                  <CheckCircle2 className="h-24 w-24" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-none">
                    Welcome to <br /><span className="text-primary not-italic">NEU Library!</span>
                  </h1>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.5em] opacity-60">Entry Protocol Confirmed</p>
                </div>
                <div className="pt-8 border-t border-dashed">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">System will reset in 5 seconds...</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
