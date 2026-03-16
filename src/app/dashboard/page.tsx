"use client";

import { useState, useMemo } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, FileDown, TrendingUp, Filter, PieChart as PieIcon, 
  Activity, Calendar as CalendarIcon, GraduationCap, 
  Briefcase, Building2, LayoutDashboard, Search
} from "lucide-react";
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

export default function IntelligenceCenter() {
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
      const matchesType = filterType === "all" || s.visitorType === filterType;

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

  const CHART_COLORS = ['#519763', '#A1E070', '#136a8a', '#267871', '#0f172a', '#64748b'];

  const generateReport = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(81, 151, 99); 
    doc.text("NEU Library Operational Intelligence Audit", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);
    doc.text(`Parameters: Range:${timeRange} | College:${filterCollege} | Class:${filterType}`, 14, 38);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.visitorId || "Unknown",
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose || "General",
      s.visitorType || "Student"
    ]);

    (doc as any).autoTable({
      startY: 48,
      head: [['Identity', 'College/Office', 'Timestamp', 'Activity', 'Class']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [81, 151, 99], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
    });

    doc.save(`NEU_INTEL_REPORT_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <NavBar />
      <main className="container mx-auto py-16 px-8 max-w-7xl space-y-16">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b pb-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Intelligence <span className="text-primary not-italic">Center</span>
            </h1>
            <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.5em] opacity-50">
              Institutional Behavioral Analytics & Traffic Oversight
            </p>
          </div>
          <Button onClick={generateReport} className="h-16 px-10 rounded-[2rem] bg-primary text-white shadow-2xl hover:scale-105 transition-all font-black uppercase tracking-widest text-xs border-8 border-white">
            <FileDown className="mr-3 h-6 w-6" />
            Generate Audit Report
          </Button>
        </div>

        {/* Professional Filters */}
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white/60 backdrop-blur-3xl overflow-hidden">
          <CardHeader className="p-10 pb-4 border-b bg-muted/20">
            <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4">
              <Filter className="h-5 w-5 text-primary" /> Multi-Vector Analytics Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-12 grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { label: "Temporal Horizon", value: timeRange, setter: setTimeRange, options: [
                { v: "day", l: "Today (24h Window)" },
                { v: "week", l: "Weekly Aggregate" },
                { v: "month", l: "Monthly Aggregate" }
              ]},
              { label: "Academic Unit (College)", value: filterCollege, setter: setFilterCollege, options: [
                { v: "all", l: "Global (All Units)" },
                ...(colleges?.map(c => ({ v: c.name, l: c.name })) || [])
              ]},
              { label: "Activity Vector (Reason)", value: filterReason, setter: setFilterReason, options: [
                { v: "all", l: "All Activities" },
                { v: "Research", l: "Research" },
                { v: "Individual Study", l: "Individual Study" },
                { v: "Group Project", l: "Group Project" },
                { v: "Book Borrowing/Return", l: "Library Services" },
                { v: "Computer Lab Use", l: "Lab Use" }
              ]},
              { label: "Visitor Class", value: filterType, setter: setFilterType, options: [
                { v: "all", l: "All Classes" },
                { v: "Student", l: "Student" },
                { v: "Staff", l: "Employee/Staff" }
              ]}
            ].map((f, i) => (
              <div key={i} className="space-y-4">
                <label className="text-[11px] font-black uppercase opacity-40 ml-2 tracking-widest">{f.label}</label>
                <Select value={f.value} onValueChange={f.setter}>
                  <SelectTrigger className="h-16 rounded-2xl border-4 border-muted/30 font-black bg-white text-xs uppercase tracking-widest hover:border-primary transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-4">
                    {f.options.map(o => (
                      <SelectItem key={o.v} value={o.v} className="font-bold py-3 uppercase text-[10px] tracking-widest">{o.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* High-Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden group hover:translate-y-[-8px] transition-all duration-500">
            <div className="h-4 bg-primary w-full" />
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aggregate Daily Traffic</p>
                  <h3 className="text-5xl font-black text-foreground tabular-nums">{stats?.totalToday || 0}</h3>
                </div>
                <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                  <CalendarIcon className="h-10 w-10 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden group hover:translate-y-[-8px] transition-all duration-500">
            <div className="h-4 bg-accent w-full" />
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Most Active Unit</p>
                  <h3 className="text-2xl font-black text-foreground uppercase italic leading-tight truncate max-w-[180px]">{stats?.mostActiveCollege}</h3>
                </div>
                <div className="h-20 w-20 bg-accent/20 rounded-[2rem] flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden group hover:translate-y-[-8px] transition-all duration-500">
            <div className="h-4 bg-primary w-full" />
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Staff vs Student Ratio</p>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-4xl font-black text-foreground">{stats?.staffCount}</h3>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">to</span>
                    <h3 className="text-4xl font-black text-primary">{stats?.studentCount}</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center"><Briefcase className="h-6 w-6" /></div>
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center"><GraduationCap className="h-6 w-6 text-primary" /></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-primary text-white overflow-hidden hover:translate-y-[-8px] transition-all duration-500 border-[8px] border-white">
            <CardContent className="p-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">System Peak</Badge>
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div className="space-y-2 mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Intensity Window</p>
                <h3 className="text-2xl font-black italic uppercase truncate">
                  {stats?.chartData.sort((a,b) => b.count - a.count)[0]?.name || "N/A"}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white p-10">
            <CardHeader className="pb-12">
              <CardTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <Activity className="h-8 w-8 text-primary" /> Temporal Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} fontWeight="900" tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: '#f7f7f7' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[16, 16, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white p-10">
            <CardHeader className="pb-12">
              <CardTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <PieIcon className="h-8 w-8 text-primary" /> Objective Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={110}
                    outerRadius={160}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={48} formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest ml-3">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
