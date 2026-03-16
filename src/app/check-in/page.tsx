
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, XCircle, Info, Loader2, BookOpen, GraduationCap, Briefcase, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * @fileOverview High-Impact Access Terminal.
 * Handles visitor identification, role assignment, and objective tracking.
 */
export default function CheckInPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [studentIdInput, setStudentIdInput] = useState("");
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Purpose and Role state
  const [selectedRole, setSelectedRole] = useState<"Student" | "Staff">("Student");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("General Visit");

  const reasonsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'reasonsForVisit');
  }, [db]);

  const { data: purposes } = useCollection(reasonsQuery);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput || !user) return;
    
    setIsSearching(true);
    setError(null);
    setFoundStudent(null);

    try {
      const studentDoc = await getDoc(doc(db, 'students', studentIdInput.toUpperCase()));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setFoundStudent({ ...data, id: studentDoc.id });
        // Auto-detect role if available in profile
        if (data.type) {
          setSelectedRole(data.type as "Student" | "Staff");
        }
      } else {
        setError(`No registry found for ID: ${studentIdInput.toUpperCase()}`);
      }
    } catch (err) {
      setError("System Access Fault. Please verify credentials.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = () => {
    if (!foundStudent || !user) return;

    addDocumentNonBlocking(collection(db, 'libraryVisits'), {
      visitorId: foundStudent.id,
      visitorName: `${foundStudent.firstName} ${foundStudent.lastName}`,
      visitorType: selectedRole,
      collegeOrOffice: foundStudent.collegeOrOffice || 'General',
      checkInTime: serverTimestamp(),
      checkOutTime: null,
      purpose: selectedPurpose
    });

    toast({
      title: "Check-in Authorized",
      description: `Log entries committed for ${foundStudent.firstName} ${foundStudent.lastName}.`,
    });
    
    setFoundStudent(null);
    setStudentIdInput("");
    setSelectedPurpose("General Visit");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-12 px-4 max-w-3xl">
        <div className="space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-black font-headline uppercase italic tracking-tighter">
              Access <span className="text-primary not-italic">Terminal</span>
            </h1>
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.4em] opacity-50">
              Institutional Entry Logic & Verification
            </p>
          </div>

          {!user ? (
            <Card className="shadow-2xl border-none bg-white rounded-[3rem] p-10 text-center space-y-6">
              <XCircle className="h-20 w-20 text-destructive mx-auto opacity-20" />
              <h2 className="text-2xl font-black uppercase italic">Identity Required</h2>
              <p className="text-muted-foreground text-xs font-black uppercase tracking-widest leading-relaxed">Please authenticate with your institutional Google account to activate this terminal.</p>
              <Button asChild className="h-14 px-10 rounded-2xl bg-primary font-black uppercase tracking-widest text-[10px]">
                <Link href="/">Secure Login</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-8">
              <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
                <div className="h-2 bg-muted w-full" />
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID Scanning Vector</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <form onSubmit={handleLookup} className="flex gap-4">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="ENTER IDENTIFIER (e.g., S1001)" 
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="pl-14 h-16 text-xl uppercase tracking-[0.2em] font-black border-2 rounded-2xl bg-muted/20 focus-visible:ring-primary"
                        autoFocus
                      />
                      <Search className="absolute left-5 top-5.5 h-6 w-6 text-muted-foreground" />
                    </div>
                    <Button 
                      type="submit" 
                      className="h-16 bg-primary px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all"
                      disabled={!studentIdInput || isSearching}
                    >
                      {isSearching ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify ID"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-center gap-5 p-6 bg-destructive/5 text-destructive rounded-[2rem] border-2 border-destructive/10 animate-in fade-in slide-in-from-top-4">
                  <XCircle className="h-8 w-8 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest">Verification Failed</p>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide">{error}</p>
                  </div>
                </div>
              )}

              {foundStudent && (
                <div className="animate-in zoom-in-95 duration-500">
                  <Card className="border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] bg-white overflow-hidden success-pulse border-4 border-white">
                    <div className="h-3 bg-primary w-full" />
                    <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                      <Badge className="bg-primary/5 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl">
                        Verification Successful
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => setFoundStudent(null)} className="rounded-full hover:bg-muted">
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </CardHeader>

                    <CardContent className="p-10 pt-0 space-y-12">
                      <div className="flex items-center gap-8">
                        <Avatar className="h-32 w-32 rounded-[2.5rem] ring-8 ring-primary/5 shadow-inner">
                          <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                            {foundStudent.firstName.charAt(0)}{foundStudent.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <h3 className="text-4xl font-black italic uppercase tracking-tighter">{foundStudent.firstName} {foundStudent.lastName}</h3>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">ID: {foundStudent.id}</span>
                            <div className="h-1 w-1 rounded-full bg-muted-foreground opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{foundStudent.collegeOrOffice || 'General Affiliation'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-dashed">
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visitor Vector (Class)</Label>
                          <RadioGroup 
                            value={selectedRole} 
                            onValueChange={(v: any) => setSelectedRole(v)}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div className={cn(
                              "relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                              selectedRole === "Student" ? "border-primary bg-primary/5 scale-105" : "border-muted opacity-60 hover:opacity-100"
                            )} onClick={() => setSelectedRole("Student")}>
                              <div className="flex items-center gap-3">
                                <GraduationCap className={cn("h-5 w-5", selectedRole === "Student" ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Student</span>
                              </div>
                              <RadioGroupItem value="Student" className="sr-only" />
                              {selectedRole === "Student" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <div className={cn(
                              "relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                              selectedRole === "Staff" ? "border-primary bg-primary/5 scale-105" : "border-muted opacity-60 hover:opacity-100"
                            )} onClick={() => setSelectedRole("Staff")}>
                              <div className="flex items-center gap-3">
                                <Briefcase className={cn("h-5 w-5", selectedRole === "Staff" ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Employee</span>
                              </div>
                              <RadioGroupItem value="Staff" className="sr-only" />
                              {selectedRole === "Staff" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visit Objective (Purpose)</Label>
                          <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                            <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/10 text-xs uppercase tracking-widest focus:ring-primary">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-primary opacity-60" />
                                <SelectValue placeholder="Select Purpose" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                              <SelectItem value="General Visit" className="rounded-xl font-bold uppercase text-[10px] py-3">General Visit</SelectItem>
                              {purposes?.map(p => (
                                <SelectItem key={p.id} value={p.name} className="rounded-xl font-bold uppercase text-[10px] py-3">{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="p-6 bg-primary/5 rounded-[2rem] flex gap-5 items-start">
                        <Info className="h-6 w-6 text-primary shrink-0 opacity-40" />
                        <p className="text-[10px] font-bold text-primary leading-relaxed uppercase tracking-wide">
                          Verification confirmed against institutional registry. Proceeding to log this access vector with the specified role and objective.
                        </p>
                      </div>
                    </CardContent>

                    <CardFooter className="p-10 pt-0">
                      <Button 
                        className="w-full h-20 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest text-lg shadow-2xl transition-all"
                        onClick={handleCheckIn}
                      >
                        <UserCheck className="mr-4 h-8 w-8" />
                        Authorize Entry Log
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {!foundStudent && !error && !isSearching && (
                <div className="text-center py-20 space-y-8 opacity-20">
                  <div className="mx-auto w-32 h-32 bg-muted/40 flex items-center justify-center rounded-[3rem] shadow-inner">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] max-w-xs mx-auto leading-loose">
                    Terminal L-01: Waiting for institutional input scan
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
