
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Book, Loader2, Users as UsersIcon, Plus, MoreVertical, Edit2, Trash2, Ban, ShieldCheck, Fingerprint, Building2 } from "lucide-react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACADEMIC_UNITS = [
  "College of Informatics and Computing Studies (CICS)",
  "College of Engineering and Architecture (CEA)",
  "College of Arts and Sciences (CAS)",
  "College of Business Administration (CBA)",
  "College of Education (CED)",
  "Medical & Health Sciences",
  "Other Specialized Colleges"
];

export default function VisitorDirectory() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    collegeOrOffice: "",
    type: "Student" as "Student" | "Teacher" | "Staff"
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
    setFormData({ id: "", firstName: "", lastName: "", email: "", collegeOrOffice: "", type: "Student" });
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
      collegeOrOffice: student.collegeOrOffice || "",
      type: student.type || "Student"
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
    <div className="min-h-screen bg-background pb-12">
      <NavBar />
      <main className="container mx-auto py-10 px-6 max-w-7xl space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase italic">
              Visitor <span className="text-primary not-italic">Hub</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest opacity-60">
              Institutional Profile & Credential Management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name, ID, affiliation..." 
                className="pl-12 h-14 rounded-2xl border-2 font-bold bg-white shadow-xl focus-visible:border-primary focus-visible:ring-0 transition-all" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-primary text-white shadow-2xl hover:scale-105 transition-all font-black uppercase tracking-widest text-xs">
                  <Plus className="mr-2 h-5 w-5" />
                  New Visitor
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-3xl font-black italic uppercase">Add Library Visitor</DialogTitle>
                  <DialogDescription className="font-bold text-muted-foreground">Manual profile creation for RFID/institutional identification.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveStudent} className="space-y-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">ID Number</Label>
                      <Input placeholder="NEU-XXXX" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Role Type</Label>
                      <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val as any})}>
                        <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/30 border-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Teacher">Teacher</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">First Name</Label>
                      <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Last Name</Label>
                      <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">College / Office</Label>
                    <Select value={formData.collegeOrOffice} onValueChange={(val) => setFormData({...formData, collegeOrOffice: val})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/30 border-none">
                        <SelectValue placeholder="Select Academic Unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ACADEMIC_UNITS.map(unit => (
                          <SelectItem key={unit} value={unit} className="text-[10px] font-bold uppercase">{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-white">Create Profile</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-40 gap-4"><Loader2 className="h-16 w-16 text-primary animate-spin" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-40 glass-card rounded-[3rem] border-4 border-dashed border-border/50">
            <UsersIcon className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-10" />
            <h3 className="text-2xl font-black uppercase italic text-muted-foreground opacity-50 tracking-tighter">No Personnel Found</h3>
            <p className="text-sm font-bold text-muted-foreground/40 mt-2">Try adjusting your search filters or add a new visitor manually.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.map((student: any) => (
              <Card key={student.id} className={cn(
                "group transition-all duration-500 rounded-[2rem] border-none shadow-xl overflow-hidden relative bg-white",
                student.isBlocked ? "opacity-75 grayscale-[0.5]" : "hover:scale-[1.03] hover:shadow-2xl"
              )}>
                <div className={cn(
                  "h-2.5",
                  student.isBlocked ? "bg-destructive animate-pulse" : "bg-primary"
                )} />
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 bg-white shadow-xl rounded-xl border-2">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                      <DropdownMenuItem onClick={() => openEditDialog(student)} className="rounded-xl font-bold p-3">
                        <Edit2 className="mr-3 h-4 w-4 text-primary" /> Edit Credentials
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => toggleBlockStatus(student)}
                        className={cn("rounded-xl font-bold p-3", student.isBlocked ? "text-primary" : "text-destructive")}
                      >
                        {student.isBlocked ? <ShieldCheck className="mr-3 h-4 w-4" /> : <Ban className="mr-3 h-4 w-4" />}
                        {student.isBlocked ? "Restore Access" : "Block Access"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl font-bold p-3 text-destructive" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}>
                        <Trash2 className="mr-3 h-4 w-4" /> Purge Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-muted rounded-[1.5rem] shadow-inner">
                      <AvatarFallback className="bg-primary/5 text-primary font-black text-2xl">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black italic uppercase tracking-tighter leading-tight">{student.firstName} {student.lastName}</CardTitle>
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                        <Fingerprint className="h-3 w-3" /> {student.id}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-dashed pt-6">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase">
                      <Building2 className="h-4 w-4 text-primary" />
                      {student.collegeOrOffice || 'General Affiliation'}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-black text-primary uppercase">
                      <Badge variant="outline" className="text-[8px] font-black px-2 py-0.5 rounded-md border-primary/20 bg-primary/5">{student.type || 'Student'}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {student.isBlocked ? (
                      <Badge variant="destructive" className="bg-destructive text-white border-none font-black text-[10px] uppercase px-3 py-1.5 rounded-xl shadow-lg">Access Terminated</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-2 border-primary/20 font-black text-[10px] uppercase px-3 py-1.5 rounded-xl">Authorized Status</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-3xl font-black italic uppercase">Update Visitor Profile</DialogTitle>
              <DialogDescription className="font-bold">Modify identity and institutional credentials.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveStudent} className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Permanent ID</Label>
                  <Input value={formData.id} disabled className="h-12 rounded-xl font-bold bg-muted/50 border-none cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Role Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val as any})}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/30 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">College / Office</Label>
                <Select value={formData.collegeOrOffice} onValueChange={(val) => setFormData({...formData, collegeOrOffice: val})}>
                  <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/30 border-none">
                    <SelectValue placeholder="Select Academic Unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ACADEMIC_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit} className="text-[10px] font-bold uppercase">{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
