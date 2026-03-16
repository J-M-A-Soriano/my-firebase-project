
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users as UsersIcon, Plus, MoreVertical, Edit2, Trash2, Ban, ShieldCheck, Fingerprint, Building2, Loader2 } from "lucide-react";
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
import { useAdmin } from "@/hooks/use-admin";

const ACADEMIC_UNITS = [
  "College of Informatics and Computing Studies (CICS)",
  "College of Engineering and Architecture (CEA)",
  "College of Arts and Sciences (CAS)",
  "College of Business Administration (CBA)",
  "College of Education (CED)",
  "Medical & Health Sciences",
  "Other Specialized Colleges"
];

/**
 * @fileOverview Visitor Hub - Institutional Profile & Credential Management (CRUD).
 * Allows administrators to manage the visitor registry, including blocking access.
 */
export default function VisitorHub() {
  const db = useFirestore();
  const { user } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
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
    if (!db || !user || !isAdmin) return null;
    return collection(db, 'students');
  }, [db, user, isAdmin]);

  const { data: students, isLoading } = useCollection(studentsRef);

  const filteredStudents = students?.filter(s => 
    s.firstName?.toLowerCase().includes(filter.toLowerCase()) || 
    s.lastName?.toLowerCase().includes(filter.toLowerCase()) ||
    s.id?.toLowerCase().includes(filter.toLowerCase()) ||
    s.collegeOrOffice?.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.firstName || !formData.lastName || !db) return;

    const studentId = formData.id.toUpperCase().trim();
    const studentRef = doc(db, 'students', studentId);
    
    setDocumentNonBlocking(studentRef, {
      ...formData,
      id: studentId,
      updatedAt: new Date().toISOString(),
      isBlocked: selectedStudent?.isBlocked || false
    }, { merge: true });

    toast({
      title: isEditDialogOpen ? "Profile Updated" : "Visitor Enrolled",
      description: `${formData.firstName} ${formData.lastName} has been saved to the registry.`,
    });

    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setFormData({ id: "", firstName: "", lastName: "", email: "", collegeOrOffice: "", type: "Student" });
  };

  const toggleBlockStatus = (student: any) => {
    if (!db) return;
    const docRef = doc(db, 'students', student.id);
    updateDocumentNonBlocking(docRef, { isBlocked: !student.isBlocked });
    toast({
      title: student.isBlocked ? "Access Restored" : "Access Terminated",
      description: `${student.firstName} ${student.lastName} has been ${student.isBlocked ? 'unblocked' : 'blocked'} from the portal.`,
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
    if (!db) return;
    if (confirm(`Are you sure you want to permanently delete the profile for ${name}? This action cannot be undone.`)) {
      deleteDocumentNonBlocking(doc(db, 'students', studentId));
      toast({ title: "Profile Purged", variant: "destructive" });
    }
  };

  if (!isAdmin && !isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-background">
        <Card className="max-w-md w-full p-10 text-center space-y-6 rounded-[3rem] border-none shadow-2xl bg-white">
          <Ban className="h-16 w-16 text-destructive mx-auto opacity-20" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Access Denied</h2>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">Administrative Authority Required</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <NavBar />
      <main className="container mx-auto py-10 px-6 max-w-7xl space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-none">
              Visitor <span className="text-primary not-italic">Hub</span>
            </h1>
            <p className="text-muted-foreground font-black text-[9px] uppercase tracking-[0.4em] opacity-40">
              Institutional Profile & Credential Management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name, ID, unit..." 
                className="pl-12 h-14 rounded-2xl border-2 font-black text-xs tracking-widest uppercase bg-white shadow-xl focus-visible:border-primary focus-visible:ring-0 transition-all" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-primary text-white shadow-2xl hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px]">
                  <Plus className="mr-2 h-5 w-5" />
                  New Visitor
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl border-none shadow-3xl">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Enroll Visitor</DialogTitle>
                  <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest opacity-60">Manual profile creation for institutional access.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveStudent} className="space-y-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">ID Number</Label>
                      <Input placeholder="NEU-XXXX" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Role Type</Label>
                      <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val as any})}>
                        <SelectTrigger className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student" className="text-xs font-black uppercase">Student</SelectItem>
                          <SelectItem value="Teacher" className="text-xs font-black uppercase">Teacher</SelectItem>
                          <SelectItem value="Staff" className="text-xs font-black uppercase">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">First Name</Label>
                      <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Last Name</Label>
                      <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">College / Office</Label>
                    <Select value={formData.collegeOrOffice} onValueChange={(val) => setFormData({...formData, collegeOrOffice: val})}>
                      <SelectTrigger className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none">
                        <SelectValue placeholder="Select Academic Unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ACADEMIC_UNITS.map(unit => (
                          <SelectItem key={unit} value={unit} className="text-[10px] font-black uppercase">{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-xl hover:scale-105 transition-all">Create Profile</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-40 gap-4"><Loader2 className="h-16 w-16 text-primary animate-spin" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-muted shadow-sm">
            <UsersIcon className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-10" />
            <h3 className="text-2xl font-black uppercase italic text-muted-foreground opacity-30 tracking-tighter">No Personnel Records</h3>
            <p className="text-[10px] font-black text-muted-foreground/30 mt-2 uppercase tracking-widest">Adjust filters or initialize new visitor registration</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.map((student: any) => (
              <Card key={student.id} className={cn(
                "group transition-all duration-500 rounded-[2.5rem] border-none shadow-xl overflow-hidden relative bg-white",
                student.isBlocked ? "opacity-75 grayscale-[0.6] ring-4 ring-destructive/10" : "hover:scale-[1.03] hover:shadow-2xl"
              )}>
                <div className={cn(
                  "h-2.5 w-full",
                  student.isBlocked ? "bg-destructive animate-pulse" : "bg-primary"
                )} />
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-12 w-12 bg-white/90 backdrop-blur-md shadow-xl rounded-xl border-2 border-white">
                        <MoreVertical className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-[1.5rem] p-3 shadow-3xl border-none">
                      <DropdownMenuItem onClick={() => openEditDialog(student)} className="rounded-xl font-black text-[10px] uppercase tracking-widest p-4">
                        <Edit2 className="mr-3 h-4 w-4 text-primary" /> Edit Credentials
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => toggleBlockStatus(student)}
                        className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest p-4", student.isBlocked ? "text-primary" : "text-destructive")}
                      >
                        {student.isBlocked ? <ShieldCheck className="mr-3 h-4 w-4" /> : <Ban className="mr-3 h-4 w-4" />}
                        {student.isBlocked ? "Restore Authority" : "Terminate Access"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl font-black text-[10px] uppercase tracking-widest p-4 text-destructive" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}>
                        <Trash2 className="mr-3 h-4 w-4" /> Purge Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardContent className="p-10 space-y-8">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-8 border-muted rounded-[2rem] shadow-inner">
                      <AvatarFallback className="bg-primary/5 text-primary font-black text-3xl italic">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-black italic uppercase tracking-tighter leading-none">{student.firstName} {student.lastName}</CardTitle>
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                        <Fingerprint className="h-3 w-3" /> {student.id}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-dashed border-muted pt-8">
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <Building2 className="h-4 w-4 text-primary opacity-60" />
                      <span className="truncate">{student.collegeOrOffice || 'General Affiliation'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[8px] font-black px-3 py-1 rounded-md border-primary/20 bg-primary/5 text-primary uppercase tracking-widest">{student.type || 'Student'}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    {student.isBlocked ? (
                      <Badge variant="destructive" className="bg-destructive text-white border-none font-black text-[9px] uppercase px-4 py-2 rounded-xl shadow-lg animate-pulse">Access Revoked</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-2 border-primary/20 font-black text-[9px] uppercase px-4 py-2 rounded-xl tracking-widest">Authorized Status</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl border-none shadow-3xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Update Credentials</DialogTitle>
              <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">Modify identity and institutional affiliation.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveStudent} className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Permanent ID</Label>
                  <Input value={formData.id} disabled className="h-12 rounded-xl font-black text-xs bg-muted/50 border-none cursor-not-allowed opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Role Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val as any})}>
                    <SelectTrigger className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student" className="text-xs font-black uppercase">Student</SelectItem>
                      <SelectItem value="Teacher" className="text-xs font-black uppercase">Teacher</SelectItem>
                      <SelectItem value="Staff" className="text-xs font-black uppercase">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">College / Office</Label>
                <Select value={formData.collegeOrOffice} onValueChange={(val) => setFormData({...formData, collegeOrOffice: val})}>
                  <SelectTrigger className="h-12 rounded-xl font-black text-xs uppercase bg-muted/30 border-none">
                    <SelectValue placeholder="Select Academic Unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ACADEMIC_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit} className="text-[10px] font-black uppercase">{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-xl hover:scale-105 transition-all">Save Profile Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
