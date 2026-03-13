
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Book, Loader2, Users as UsersIcon, Plus, MoreVertical, Edit2, Trash2, Ban, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
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
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function VisitorDirectory() {
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
    collegeOrOffice: ""
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
      updatedAt: new Date().toISOString(),
      isBlocked: selectedStudent?.isBlocked || false
    }, { merge: true });

    toast({
      title: isEditDialogOpen ? "Profile Updated" : "Visitor Added",
      description: `${formData.firstName} ${formData.lastName} saved successfully.`,
    });

    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setFormData({ id: "", firstName: "", lastName: "", email: "", collegeOrOffice: "" });
  };

  const toggleBlockStatus = (student: any) => {
    const docRef = doc(db, 'students', student.id);
    updateDocumentNonBlocking(docRef, { isBlocked: !student.isBlocked });
    toast({
      title: student.isBlocked ? "Access Restored" : "Visitor Blocked",
      description: `${student.firstName} ${student.lastName} has been ${student.isBlocked ? 'unblocked' : 'blocked'}.`,
      variant: student.isBlocked ? "default" : "destructive"
    });
  };

  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || "",
      collegeOrOffice: student.collegeOrOffice || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteDocumentNonBlocking(doc(db, 'students', studentId));
      toast({ title: "Visitor Deleted", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">NEU Visitor Directory</h1>
            <p className="text-muted-foreground">Manage student and staff library access profiles.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name, ID, email..." 
                className="pl-9 h-10 shadow-sm" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Visitor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Library Visitor</DialogTitle>
                  <DialogDescription>Create a profile for RFID/Email lookup.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveStudent} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Student/Employee ID</Label>
                      <Input placeholder="e.g. NEU-2023-01" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>College / Office</Label>
                      <Input placeholder="e.g. CAS" value={formData.collegeOrOffice} onChange={(e) => setFormData({...formData, collegeOrOffice: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Institutional Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Profile</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-24 gap-4"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Results Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student: any) => (
              <Card key={student.id} className={cn(
                "group transition-all duration-300 relative overflow-hidden",
                student.isBlocked ? "border-destructive bg-destructive/5" : "hover:border-primary border-primary/10"
              )}>
                <div className={cn(
                  "h-1.5",
                  student.isBlocked ? "bg-destructive" : "bg-primary"
                )} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur shadow-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openEditDialog(student)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => toggleBlockStatus(student)}
                        className={student.isBlocked ? "text-primary" : "text-destructive"}
                      >
                        {student.isBlocked ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                        {student.isBlocked ? "Unblock Visitor" : "Block Visitor"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-headline">{student.firstName} {student.lastName}</CardTitle>
                      <p className="text-xs text-muted-foreground font-bold uppercase">{student.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t pt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Book className="h-3.5 w-3.5" />
                      <span className="font-semibold">{student.collegeOrOffice || 'General'}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {student.isBlocked ? (
                      <Badge variant="destructive" className="animate-pulse">Access Blocked</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Authorized</Badge>
                    )}
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
              <DialogTitle>Edit Visitor Profile</DialogTitle>
              <DialogDescription>Update institutional information.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveStudent} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input value={formData.id} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>College / Office</Label>
                  <Input value={formData.collegeOrOffice} onChange={(e) => setFormData({...formData, collegeOrOffice: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="submit">Update Profile</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
