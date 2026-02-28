
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, XCircle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      setError("Database connection error. Please sign in and check permissions.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = () => {
    if (!foundStudent || !user) return;

    const sessionId = `sess_${Date.now()}`;
    addDocumentNonBlocking(collection(db, 'librarySessions'), {
      id: sessionId,
      studentId: foundStudent.id,
      firstName: foundStudent.firstName,
      lastName: foundStudent.lastName,
      checkInTime: serverTimestamp(),
      checkOutTime: null
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
            <h1 className="text-3xl font-bold font-headline">Student Access Control</h1>
            <p className="text-muted-foreground">Verify student ID to authorize library entry.</p>
          </div>

          {!user ? (
            <Card className="shadow-lg border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6 text-center space-y-4">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold">Authentication Required</h2>
                <p className="text-muted-foreground">Please sign in from the landing page to access the database.</p>
                <Button asChild variant="outline">
                  <Link href="/">Go to Login</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-lg border-primary/20">
                <CardHeader>
                  <CardTitle>ID Entry</CardTitle>
                  <CardDescription>Enter the unique student identifier</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLookup} className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="e.g., S1001" 
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="pl-10 h-12 text-lg uppercase tracking-widest"
                        autoFocus
                      />
                      <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button 
                      type="submit" 
                      className="h-12 bg-primary px-6"
                      disabled={!studentIdInput || isSearching}
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                  <XCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {foundStudent && (
                <Card className="glass-card animate-in zoom-in-95 duration-300 border-primary success-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-none px-2 py-0 text-[10px] uppercase tracking-wider">
                        Profile Verified
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => setFoundStudent(null)}>
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4 py-4">
                      <Avatar className="h-24 w-24 ring-4 ring-accent ring-offset-2">
                        <AvatarFallback className="text-2xl">{foundStudent.firstName.charAt(0)}{foundStudent.lastName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <h3 className="text-2xl font-bold font-headline">{foundStudent.firstName} {foundStudent.lastName}</h3>
                        <p className="text-muted-foreground">Grade {foundStudent.gradeLevel} • ID: {foundStudent.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Status</Label>
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          Eligible for Entry
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Email</Label>
                        <div className="text-xs truncate font-medium">{foundStudent.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg text-accent-foreground text-xs">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>Student is currently authorized for library access. No active restrictions found.</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold"
                      onClick={handleCheckIn}
                    >
                      <UserCheck className="mr-2 h-5 w-5" />
                      Confirm Check-In
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {!foundStudent && !error && !isSearching && (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted flex items-center justify-center rounded-full">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Enter a student ID to begin the verification process.
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
