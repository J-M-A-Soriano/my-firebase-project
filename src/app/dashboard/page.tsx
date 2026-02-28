
"use client";

import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LogOut, Clock, Calendar as CalendarIcon, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function Dashboard() {
  const { toast } = useToast();
  const db = useFirestore();

  const sessionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'librarySessions'),
      where('checkOutTime', '==', null)
    );
  }, [db]);

  const { data: presentSessions, isLoading } = useCollection(sessionsQuery);

  const handleCheckOut = (sessionId: string, studentName: string) => {
    const docRef = doc(db, 'librarySessions', sessionId);
    updateDocumentNonBlocking(docRef, {
      checkOutTime: serverTimestamp()
    });
    
    toast({
      title: "Student Checked Out",
      description: `${studentName} has successfully exited the library.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Library Dashboard</h1>
            <p className="text-muted-foreground">Monitoring real-time occupancy and traffic.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Button>
            <Button size="sm" className="h-9 bg-primary" asChild>
              <Link href="/check-in">
                <UserPlus className="mr-2 h-4 w-4" />
                Quick Check-In
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Occupancy</p>
                  <h3 className="text-4xl font-bold">{presentSessions?.length || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {presentSessions ? `Capacity: 50 students (${((presentSessions.length / 50) * 100).toFixed(0)}% full)` : 'Loading occupancy...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Session Status</p>
                  <h3 className="text-4xl font-bold">{isLoading ? "..." : "Active"}</h3>
                </div>
                <div className="p-3 bg-accent/20 rounded-full">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Database connected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Feed</p>
                  <h3 className="text-4xl font-bold">ON</h3>
                </div>
                <div className="p-3 bg-secondary rounded-full">
                  <Clock className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Listening for changes...
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
            <div>
              <CardTitle className="text-lg">Students Currently in Library</CardTitle>
              <CardDescription>Real-time presence monitoring</CardDescription>
            </div>
            <Badge variant="outline" className="bg-background text-primary border-primary/20">
              Live Feed
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                <p className="text-muted-foreground">Syncing occupancy data...</p>
              </div>
            ) : !presentSessions || presentSessions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground">The library is currently empty.</p>
              </div>
            ) : (
              <div className="divide-y">
                {presentSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback>{session.firstName?.charAt(0)}{session.lastName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{session.firstName} {session.lastName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{session.studentId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Checked in</span>
                        <span className="text-sm font-medium">
                          {session.checkInTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCheckOut(session.id, `${session.firstName} ${session.lastName}`)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Check-out
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
