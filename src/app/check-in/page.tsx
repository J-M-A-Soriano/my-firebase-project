
"use client";

import { useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, XCircle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function CheckInPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [studentIdInput, setStudentIdInput] = useState("");
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput || !user) return;
    
    setIsSearching(true);
    setError(null);
    setFoundStudent(null);

    try {
      const studentDoc = await getDoc(doc(db, 'students', studentIdInput.toUpperCase()));
      if (studentDoc.exists()) {
        setFoundStudent({ ...studentDoc.data(), id: studentDoc.id });
      } else {
        setError(`No student found with ID: ${studentIdInput.toUpperCase()}`);
      }
    } catch (err) {
      setError("Access denied. Admin credentials required for visitor lookup.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = () => {
    if (!foundStudent || !user) return;

    addDocumentNonBlocking(collection(db, 'libraryVisits'), {
      visitorId: foundStudent.id,
      visitorName: `${foundStudent.firstName} ${foundStudent.lastName}`,
      visitorType: 'Student',
      collegeOrOffice: foundStudent.collegeOrOffice || 'N/A',
      checkInTime: serverTimestamp(),
      checkOutTime: null,
      purpose: 'General Visit'
    });

    toast({
      title: "Check-in Successful",
      description: `${foundStudent.firstName} ${foundStudent.lastName} has been logged.`,
    });
    
    setFoundStudent(null);
    setStudentIdInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline uppercase italic">Access Control</h1>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">Terminal L-01 Entry Verification</p>
          </div>

          {!user ? (
            <Card className="shadow-lg border-destructive/20 bg-destructive/5 rounded-[2rem]">
              <CardContent className="pt-8 text-center space-y-4">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold uppercase italic">Authentication Required</h2>
                <p className="text-muted-foreground text-sm font-medium">Please sign in with your institutional Google account.</p>
                <Button asChild variant="outline" className="rounded-xl font-black uppercase tracking-widest text-xs">
                  <Link href="/">Go to Login</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-xl border-primary/10 rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="bg-muted/20">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">ID Entry Terminal</CardTitle>
                  <CardDescription className="font-bold text-xs uppercase opacity-50">Scan RFID or enter identifier</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleLookup} className="flex gap-3">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="e.g., S1001" 
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="pl-12 h-14 text-xl uppercase tracking-widest font-black border-2 rounded-2xl"
                        autoFocus
                      />
                      <Search className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button 
                      type="submit" 
                      className="h-14 bg-primary px-8 rounded-2xl font-black uppercase tracking-widest text-xs"
                      disabled={!studentIdInput || isSearching}
                    >
                      {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Lookup"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-center gap-4 p-5 bg-destructive/5 text-destructive rounded-2xl border-2 border-destructive/10 animate-in fade-in slide-in-from-top-4">
                  <XCircle className="h-6 w-6" />
                  <p className="text-sm font-black uppercase tracking-wide">{error}</p>
                </div>
              )}

              {foundStudent && (
                <Card className="glass-card animate-in zoom-in-95 duration-500 border-none shadow-2xl rounded-[2.5rem] success-pulse overflow-hidden">
                  <div className="h-2 bg-primary w-full" />
                  <CardHeader className="pb-2 px-8 pt-8">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                        Verified Identity
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => setFoundStudent(null)} className="rounded-full">
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8 px-8 pb-8">
                    <div className="flex flex-col items-center gap-4 py-4">
                      <Avatar className="h-24 w-24 ring-4 ring-primary/10 ring-offset-4 rounded-[2rem]">
                        <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">
                          {foundStudent.firstName.charAt(0)}{foundStudent.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">{foundStudent.firstName} {foundStudent.lastName}</h3>
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest opacity-50 mt-1">ID: {foundStudent.id} • {foundStudent.collegeOrOffice || 'General'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-2xl border border-white/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Vector Status</Label>
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase italic">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          Eligible
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-2xl border border-white/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Account</Label>
                        <div className="text-[10px] truncate font-black uppercase opacity-60 italic">{foundStudent.email || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl text-primary text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                      <Info className="h-4 w-4 shrink-0" />
                      <p>Institutional record confirms authorized status. Logging entry vector to central database.</p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 h-16 rounded-2xl text-lg font-black uppercase italic shadow-2xl"
                      onClick={handleCheckIn}
                    >
                      <UserCheck className="mr-3 h-6 w-6" />
                      Confirm Access
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {!foundStudent && !error && !isSearching && (
                <div className="text-center py-20 space-y-6 opacity-30">
                  <div className="mx-auto w-24 h-24 bg-muted/50 flex items-center justify-center rounded-[2rem]">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] max-w-xs mx-auto">
                    Waiting for scanner input...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
