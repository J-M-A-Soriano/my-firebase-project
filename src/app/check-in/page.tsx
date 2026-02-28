
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, ChevronRight, XCircle, Info } from "lucide-react";
import { MOCK_STUDENTS, Student } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function CheckInPage() {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    setFoundStudent(null);

    // Simulate database delay
    setTimeout(() => {
      const student = MOCK_STUDENTS.find(s => s.id === studentId.toUpperCase());
      if (student) {
        setFoundStudent(student);
      } else {
        setError("No student found with this ID.");
      }
      setIsSearching(false);
    }, 600);
  };

  const handleCheckIn = () => {
    toast({
      title: "Check-in Successful",
      description: `${foundStudent?.name} has been logged at ${new Date().toLocaleTimeString()}.`,
    });
    setFoundStudent(null);
    setStudentId("");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline">Student Access Control</h1>
            <p className="text-muted-foreground">Enter student ID to verify profile and authorize entry.</p>
          </div>

          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle>ID Entry</CardTitle>
              <CardDescription>Search by ID (e.g., S1001, S1002)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    placeholder="Enter Student ID" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="pl-10 h-12 text-lg uppercase tracking-widest"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 bg-primary px-6"
                  disabled={!studentId || isSearching}
                >
                  {isSearching ? "Searching..." : "Lookup"}
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
                    <AvatarImage src={foundStudent.avatar} alt={foundStudent.name} />
                    <AvatarFallback className="text-2xl">{foundStudent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold font-headline">{foundStudent.name}</h3>
                    <p className="text-muted-foreground">Grade {foundStudent.grade} • ID: {foundStudent.id}</p>
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
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Library Debt</Label>
                    <div className="text-sm font-semibold">$0.00</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg text-accent-foreground text-xs">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Student has valid membership. No overdue books currently listed in the system.</p>
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
                Ready to check-in. Use the student scanner or enter ID manually.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
