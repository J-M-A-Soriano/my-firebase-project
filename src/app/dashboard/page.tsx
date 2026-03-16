"use client";

import { useState, useMemo } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileDown, TrendingUp, Filter, PieChart as PieIcon, Activity, Calendar as CalendarIcon, GraduationCap, Briefcase, Building2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns";
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

  const { data: sessions, isLoading } = useCollection(sessionsQuery);
  const { data: colleges } = useCollection(collegesQuery);

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
      if (filterType === "Staff") matchesType = s.visitorType === 'Staff';
      if (filterType === "Student") matchesType = s.visitorType === 'Student';

      return inTimeRange && matchesReason && matchesCollege && matchesType;
    });

    const chartDataMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const collegeMap: Record<string, number> = {};
    let staffCount = 0;
    let studentCount = 0;

    filtered.forEach(s => {
      const date = s.checkInTime.toDate();
      const key = timeRange === "day" ? format(date, "HH:00") : format(date, "EEE dd");
      chartDataMap[key] = (chartDataMap[key] || 0) + 1;
      
      const purpose = s.purpose || "General";
      purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;

      const college = s.collegeOrOffice || "N/A";
      collegeMap[college] = (collegeMap[college] || 0) + 1;

      if (s.visitorType === "Staff") staffCount++;
      if (s.visitorType === "Student") studentCount++;
    });

    const chartData = Object.entries(chartDataMap).map(([name, count]) => ({ name, count }));
    const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    
    const mostActiveCollege = Object.entries(collegeMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";
    const totalToday = sessions.filter(s => s.checkInTime && isSameDay(s.checkInTime.toDate(), now)).length;

    return { 
      total: filtered.length, 
      totalToday,
      chartData, 
      pieData, 
      filteredSessions: filtered,
      staffCount,
      studentCount,
      mostActiveCollege
    };
  }, [sessions, timeRange, filterReason, filterCollege, filterType]);

  const COLORS = ['#0f172a', '#2563eb', '#3b82f6', '#1d4ed8', '#1e293b', '#64748b'];

  const generateReport = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); 
    doc.text("NEU Library Intelligence Audit", 14, 25);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);
    doc.text(`Horizon: ${timeRange.toUpperCase()} | Reason:${filterReason} | College:${filterCollege}`, 14, 38);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.visitorId || "Anonymous",
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose || "General",
      s.visitorType || "Student"
    ]);

    (doc as any).autoTable({
      startY: 48,
      head: [['Identity', 'Affiliation', 'Timestamp', 'Objective', 'Class']],
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
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Intelligence <span className="text-primary not-italic">Center</span>
            </h1>
            <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.4em] opacity-50">
              Institutional Behavioral Analytics & Traffic Oversight
            </p>
          </div>
          <Button onClick={generateReport} className="h-14 px-8 rounded-2xl bg-primary text-white shadow-2xl hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px]">
            <FileDown className="mr-3 h-5 w-5" />
            Generate Audit Report
          </Button>
        </div>

        {/* Professional Filters */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b bg-muted/10">
            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <Filter className="h-4 w-4" /> Operational Intelligence Parameters
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
                  <SelectItem value="day">Today (24h Window)</SelectItem>
                  <SelectItem value="week">Weekly Aggregate</SelectItem>
                  <SelectItem value="month">Monthly Aggregate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Academic Unit (College)</label>
              <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global (All Colleges)</SelectItem>
                  {colleges?.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Visit Objective (Reason)</label>
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global Objectives</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Individual Study">Individual Study</SelectItem>
                  <SelectItem value="Group Project">Group Project</SelectItem>
                  <SelectItem value="Book Borrowing/Return">Book Borrowing/Return</SelectItem>
                  <SelectItem value="Computer Lab Use">Computer Lab Use</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 ml-1 tracking-widest">Employment Status</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black bg-muted/20 text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Staff">Staff/Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Professional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="h-3 bg-primary w-full" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Visits Today</p>
                  <h3 className="text-4xl font-black text-foreground tabular-nums">{stats?.totalToday || 0}</h3>
                </div>
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="h-3 bg-accent w-full" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Most Active College</p>
                  <h3 className="text-2xl font-black text-foreground uppercase italic leading-tight truncate max-w-[150px]">{stats?.mostActiveCollege}</h3>
                </div>
                <div className="h-14 w-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="h-3 bg-primary w-full" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Staff vs. Student Ratio</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-foreground">{stats?.staffCount}</h3>
                    <span className="text-xs font-bold text-muted-foreground">to</span>
                    <h3 className="text-3xl font-black text-primary">{stats?.studentCount}</h3>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center"><Briefcase className="h-5 w-5" /></div>
                  <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center"><GraduationCap className="h-5 w-5 text-primary" /></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary text-white overflow-hidden hover:scale-[1.02] transition-transform">
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/10 text-white border-none font-black text-[9px] uppercase tracking-widest">System Peak</Badge>
                <TrendingUp className="h-5 w-5 opacity-40" />
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Intensity Window</p>
                <h3 className="text-xl font-black italic uppercase truncate">
                  {stats?.chartData.sort((a,b) => b.count - a.count)[0]?.name || "N/A"}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-6">
            <CardHeader className="pb-10">
              <CardTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
                <Activity className="h-6 w-6 text-primary" /> Temporal Analysis
              </CardTitle>
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
              <CardTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
                <PieIcon className="h-6 w-6 text-primary" /> Objective Analysis
              </CardTitle>
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
      </main>
    </div>
  );
}
