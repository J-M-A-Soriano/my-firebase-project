
"use client";

import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Book, ShieldAlert } from "lucide-react";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function StudentsDirectory() {
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
            <Input placeholder="Filter by name or ID..." className="pl-9 h-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_STUDENTS.map((student) => (
            <Card key={student.id} className="group hover:border-primary transition-all duration-300 overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-primary/10 to-accent/10" />
              <CardHeader className="relative pt-0 -mt-8 flex flex-col items-center">
                <Avatar className="h-20 w-20 border-4 border-background ring-2 ring-primary/20 group-hover:ring-primary transition-all duration-300">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center mt-2">
                  <CardTitle className="text-lg font-headline">{student.name}</CardTitle>
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
                    {student.grade} Grade
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Active Member
                  </Badge>
                  <Badge variant="outline" className="bg-accent/5 text-accent-foreground border-accent/20">
                    No Overdues
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
