
"use client";

import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Book, Loader2, Users as UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { useState } from "react";

export default function StudentsDirectory() {
  const db = useFirestore();
  const { user } = useUser();
  const [filter, setFilter] = useState("");

  const studentsRef = useMemoFirebase(() => {
    // Only return the reference if the user is authenticated
    if (!db || !user) return null;
    return collection(db, 'students');
  }, [db, user]);

  const { data: students, isLoading } = useCollection(studentsRef);

  const filteredStudents = students?.filter(s => 
    s.firstName?.toLowerCase().includes(filter.toLowerCase()) || 
    s.lastName?.toLowerCase().includes(filter.toLowerCase()) ||
    s.id?.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Student Directory</h1>
            <p className="text-muted-foreground">Manage library memberships and student profiles.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by name or ID..." 
              className="pl-9 h-10" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Loading student database...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Students Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or check database permissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student: any) => (
              <Card key={student.id} className="group hover:border-primary transition-all duration-300 overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-primary/10 to-accent/10" />
                <CardHeader className="relative pt-0 -mt-8 flex flex-col items-center">
                  <Avatar className="h-20 w-20 border-4 border-background ring-2 ring-primary/20 group-hover:ring-primary transition-all duration-300">
                    <AvatarFallback>{student.firstName?.charAt(0)}{student.lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center mt-2">
                    <CardTitle className="text-lg font-headline">{student.firstName} {student.lastName}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{student.id}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {student.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Book className="h-4 w-4" />
                      {student.gradeLevel || 'N/A'} Grade
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      Active Member
                    </Badge>
                    <Badge variant="outline" className="bg-accent/5 text-accent-foreground border-accent/20">
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
