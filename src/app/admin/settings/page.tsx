
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserPlus, Trash2, Loader2, KeyRound, Fingerprint } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

/**
 * @fileOverview System Administration & RBAC Registry.
 * Allows the super-admin to manage the dynamic admin_users registry.
 */
export default function AdminSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [newAdminUid, setNewAdminUid] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const adminsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'admin_users');
  }, [db]);

  const { data: adminRegistry, isLoading } = useCollection(adminsQuery);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid || !db) return;

    setIsAdding(true);
    const adminRef = doc(db, 'admin_users', newAdminUid.trim());
    
    setDocumentNonBlocking(adminRef, {
      role: 'Administrator',
      grantedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Registry Updated",
      description: `Authority granted to UID: ${newAdminUid}`,
    });
    
    setNewAdminUid("");
    setIsAdding(false);
  };

  const handleDeleteAdmin = async (uid: string) => {
    if (!db) return;
    if (confirm("Revoke administrative authority for this account?")) {
      await deleteDoc(doc(db, 'admin_users', uid));
      toast({ title: "Authority Revoked", variant: "destructive" });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <Card className="max-w-md w-full p-10 text-center space-y-6 rounded-[3rem] border-none shadow-2xl">
          <KeyRound className="h-16 w-16 text-destructive mx-auto opacity-20" />
          <h2 className="text-3xl font-black uppercase italic">Access Denied</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-60">System Administrator Credentials Required</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-12 px-8 max-w-5xl space-y-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
            System <span className="text-primary not-italic">Settings</span>
          </h1>
          <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.4em] opacity-50">
            RBAC Registry & Authority Management
          </p>
        </div>

        <div className="grid gap-10">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-2xl font-black uppercase italic flex items-center gap-4">
                <UserPlus className="h-7 w-7 text-primary" /> Grant Authority
              </CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">
                Authorize new administrative accounts via Firebase UID
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <form onSubmit={handleAddAdmin} className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Account UID</Label>
                  <Input 
                    placeholder="Enter User ID (e.g., gHZ9n7s2b9...)" 
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    className="h-14 rounded-2xl border-2 font-black text-xs tracking-widest uppercase bg-muted/20"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isAdding || !newAdminUid}
                  className="h-14 mt-6 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                >
                  {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize User"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b bg-muted/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3">
                <ShieldCheck className="h-4 w-4" /> Authorized Admin Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading ? (
                  <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></div>
                ) : adminRegistry?.length === 0 ? (
                  <div className="p-20 text-center text-xs font-black uppercase opacity-30 tracking-widest">No Dynamic Admins Registered</div>
                ) : (
                  adminRegistry?.map((admin: any) => (
                    <div key={admin.id} className="p-8 flex items-center justify-between group hover:bg-muted/5 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/5">
                          <Fingerprint className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black tracking-widest uppercase text-foreground">{admin.id}</p>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-md">Administrator</Badge>
                            <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Granted: {new Date(admin.grantedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="h-12 w-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
