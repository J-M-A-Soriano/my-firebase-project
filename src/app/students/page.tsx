
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Book, Loader2, Users as UsersIcon, Plus, MoreVertical, Edit2, Trash2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function StudentsDirectory() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    gradeLevel: ""
  });

  const studentsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'students');
  }, [db, user]);

  const { data: students, isLoading } = useCollection(studentsRef);

  const filteredStudents = students?.filter(s => 
    s.firstName?.toLowerCase().includes(filter.toLowerCase()) || 
    s.lastName?.toLowerCase().includes(filter.toLowerCase()) ||
    s.id?.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.firstName || !formData.lastName) return;

    const studentId = formData.id.toUpperCase();
    const studentRef = doc(db, 'students', studentId);
    
    setDocumentNonBlocking(studentRef, {
      ...formData,
      id: studentId,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: isEditDialogOpen ? "Student Updated" : "Student Added",
      description: `${formData.firstName} ${formData.lastName} has been saved to the database.`,
    });

    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setFormData({ id: "", firstName: "", lastName: "", email: "", gradeLevel: "" });
  };

  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || "",
      gradeLevel: student.gradeLevel || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteDocumentNonBlocking(doc(db, 'students', studentId));
      toast({
        title: "Student Deleted",
        description: `${name} has been removed from the directory.`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Student Directory</h1>
            <p className="text-muted-foreground">Manage library memberships and student profiles.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 h-10" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Create a new profile for library access.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveStudent} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="id">Student ID</Label>
                      <Input id="id" placeholder="e.g. S1001" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade Level</Label>
                      <Input id="grade" placeholder="e.g. 10th" value={formData.gradeLevel} onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Student</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
            <p className="text-muted-foreground">Try adjusting your search or add a new student.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student: any) => (
              <Card key={student.id} className="group hover:border-primary transition-all duration-300 overflow-hidden relative">
                <div className="h-16 bg-gradient-to-r from-primary/10 to-accent/10" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(student)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
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
                      <span className="truncate">{student.email || 'No email provided'}</span>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student Profile</DialogTitle>
              <DialogDescription>Update details for {selectedStudent?.firstName}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveStudent} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-id">Student ID</Label>
                  <Input id="edit-id" value={formData.id} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-grade">Grade Level</Label>
                  <Input id="edit-grade" value={formData.gradeLevel} onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input id="edit-firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input id="edit-lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="submit">Update Student</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
