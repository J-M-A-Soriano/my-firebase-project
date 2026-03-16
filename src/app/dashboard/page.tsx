"use client";

import { useState, useMemo } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileDown, TrendingUp, Loader2, Clock, Calendar as CalendarIcon, UserCheck, Filter, ArrowRight } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState("day");
  const [filterReason, setFilterReason] = useState("all");
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'libraryVisits'),
      orderBy('checkInTime', 'desc'),
      limit(2000)
    );
  }, [db, user]);

  const collegesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'colleges');
  }, [db, user]);

  const reasonsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'reasonsForVisit');
  }, [db, user]);

  const { data: sessions, isLoading } = useCollection(sessionsQuery);
  const { data: colleges } = useCollection(collegesQuery);
  const { data: reasons } = useCollection(reasonsQuery);

  const stats = useMemo(() => {
    if (!sessions) return null;

    const now = new Date();
    let rangeInterval: { start: Date; end: Date };

    switch (timeRange) {
      case "week":
        rangeInterval = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case "month":
        rangeInterval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      default:
        rangeInterval = { start: startOfDay(now), end: endOfDay(now) };
    }

    const filtered = sessions.filter(s => {
      if (!s.checkInTime) return false;
      const date = s.checkInTime.toDate();
      
      const inTimeRange = isWithinInterval(date, rangeInterval);
      const matchesReason = filterReason === "all" || s.purpose === filterReason;
      const matchesCollege = filterCollege === "all" || s.collegeOrOffice === filterCollege;
      
      let matchesType = true;
      if (filterType === "employee") matchesType = s.visitorType === 'Staff';
      if (filterType === "student") matchesType = s.visitorType === 'Student';

      return inTimeRange && matchesReason && matchesCollege && matchesType;
    });

    const chartDataMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};

    filtered.forEach(s => {
      const date = s.checkInTime.toDate();
      const key = timeRange === "day" ? format(date, "HH:00") : format(date, "EEE dd");
      chartDataMap[key] = (chartDataMap[key] || 0) + 1;
      purposeMap[s.purpose || "Other"] = (purposeMap[s.purpose || "Other"] || 0) + 1;
    });

    const chartData = Object.entries(chartDataMap).map(([name, count]) => ({ name, count }));
    const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));

    return { total: filtered.length, chartData, pieData, filteredSessions: filtered };
  }, [sessions, timeRange, filterReason, filterCollege, filterType]);

  const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#2563eb', '#64748b'];

  const generateReport = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); 
    doc.text("NEU Library Intelligence Audit", 14, 25);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);
    doc.text(`Horizon: ${timeRange.toUpperCase()} | Filters: R:${filterReason} | C:${filterCollege} | T:${filterType}`, 14, 38);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.visitorId || "Anonymous",
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose || "General"
    ]);

    (doc as any).autoTable({
      startY: 48,
      head: [['Identity', 'Affiliation', 'Timestamp', 'Objective']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
    });

    doc.save(`NEU_INTEL_AUDIT_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <NavBar />
      <main className="container mx-auto py-12 px-8 max-w-7xl space-y-12">
        
        {/* Intelligence Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Intelligence <span className="text-primary not-italic">Center</span>
            </h1>
            <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.4em] opacity-50">
              Visitor Behavioral Analytics & Access Management
            </p>
          </div>
          <Button onClick={generateReport} className="h-14 px-8 rounded-2xl bg-primary text-white shadow-2xl hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px]">
            <FileDown className="mr-3 h-5 w-5" />
            Download Intel Audit
          </Button>
        </div>

        {/* Global Control Filters */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b bg-muted/10">
            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <Filter className="h-4 w-4" /> Global Intelligence Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Temporal Horizon</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today (24h)</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Academic Unit</label>
              <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global (All)</SelectItem>
                  {colleges?.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Objective</label>
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Objectives</SelectItem>
                  {reasons?.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                  <SelectItem value="Reading Books">Reading Books</SelectItem>
                  <SelectItem value="Thesis Research">Thesis Research</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Visitor Vector</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global Profiles</SelectItem>
                  <SelectItem value="student">Student Class</SelectItem>
                  <SelectItem value="employee">Staff / Teaching Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Intelligence Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden group">
            <div className="h-3 bg-primary w-full" />
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em]">Aggregate Traffic</p>
                  <h3 className="text-6xl font-black text-foreground tabular-nums tracking-tighter">{stats?.total || 0}</h3>
                </div>
                <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border-2 border-primary/5">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden group">
            <div className="h-3 bg-accent w-full" />
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em]">Live Occupancy</p>
                  <h3 className="text-6xl font-black text-foreground tabular-nums tracking-tighter">
                    {sessions?.filter(s => !s.checkOutTime).length || 0}
                  </h3>
                </div>
                <div className="h-20 w-20 bg-accent/10 rounded-[2rem] flex items-center justify-center border-2 border-accent/5">
                  <UserCheck className="h-10 w-10 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-primary text-white overflow-hidden">
            <CardContent className="p-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/10 text-white border-none font-black px-4 py-1.5 rounded-xl text-[9px] uppercase tracking-widest">Secure Vector</Badge>
                <TrendingUp className="h-6 w-6 opacity-40" />
              </div>
              <div className="space-y-2 mt-8">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Peak Intensity</p>
                <h3 className="text-3xl font-black italic uppercase leading-none tracking-tight">
                  {stats?.chartData.sort((a,b) => b.count - a.count)[0]?.name || "SYNCING..."}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Temporal Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-6">
            <CardHeader className="pb-10">
              <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Temporal Distribution</CardTitle>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mt-1">Hourly Access Patterns</p>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-6">
            <CardHeader className="pb-10">
              <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Objective Variance</CardTitle>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mt-1">Visit Purpose Analytics</p>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={40} formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest ml-2">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Live Vector Feed */}
        <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-10 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Live Activity Vector</CardTitle>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Real-time Credential Validation Feed</p>
              </div>
              <Badge className="bg-primary/5 text-primary border-2 border-primary/10 font-black px-6 py-2 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-sm">REAL-TIME SYNC</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-32 text-center"><Loader2 className="h-16 w-16 animate-spin mx-auto text-primary opacity-20" /></div>
            ) : (
              <div className="divide-y divide-border/30 max-h-[800px] overflow-auto custom-scrollbar">
                {stats?.filteredSessions.map((session: any) => (
                  <div key={session.id} className="p-8 flex items-center justify-between hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-8">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:scale-110 transition-transform">
                        {session.visitorName?.charAt(0) || "V"}
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-xl leading-none uppercase tracking-tight">{session.visitorName || "Unauthorized Guest"}</p>
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{session.collegeOrOffice}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl">
                        {session.purpose}
                      </Badge>
                      <p className="text-[12px] font-black text-muted-foreground uppercase opacity-40 flex items-center justify-end gap-2 tracking-widest">
                        <Clock className="h-4 w-4" />
                        {format(session.checkInTime.toDate(), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                {stats?.filteredSessions.length === 0 && (
                  <div className="p-32 text-center opacity-20 font-black uppercase tracking-[0.5em] text-sm italic">Null Vector State</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}