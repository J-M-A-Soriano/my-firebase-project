
"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LogOut, Clock, Calendar as CalendarIcon, UserPlus } from "lucide-react";
import { MOCK_STUDENTS, Student } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Dashboard() {
  const { toast } = useToast();
  // Simulate live occupancy
  const [presentStudents, setPresentStudents] = useState<Student[]>([]);
  
  useEffect(() => {
    // Initial load: pick a few students as currently present
    setPresentStudents(MOCK_STUDENTS.slice(0, 3));
  }, []);

  const handleCheckOut = (studentId: string) => {
    const student = presentStudents.find(s => s.id === studentId);
    setPresentStudents(prev => prev.filter(s => s.id !== studentId));
    toast({
      title: "Student Checked Out",
      description: `${student?.name} has successfully exited the library.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Library Dashboard</h1>
            <p className="text-muted-foreground">Monitoring real-time activity and occupancy.</p>
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
                  <h3 className="text-4xl font-bold">{presentStudents.length}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Capacity: 50 students ({(presentStudents.length / 50 * 100).toFixed(0)}% full)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Total</p>
                  <h3 className="text-4xl font-bold">142</h3>
                </div>
                <div className="p-3 bg-accent/20 rounded-full">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                +12% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg. Stay Duration</p>
                  <h3 className="text-4xl font-bold">42m</h3>
                </div>
                <div className="p-3 bg-secondary rounded-full">
                  <Clock className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Stable across all grades
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
            {presentStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground">The library is currently empty.</p>
              </div>
            ) : (
              <div className="divide-y">
                {presentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{student.id}</span>
                          <span>•</span>
                          <span>Grade {student.grade}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Checked in</span>
                        <span className="text-sm font-medium">10:15 AM</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCheckOut(student.id)}
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
