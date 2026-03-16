"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileDown, TrendingUp, Filter, PieChart as PieIcon, 
  Activity, Building2, Clock, UsersRound, Loader2, KeyRound
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, subHours } from "date-fns";
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
import { useAdmin } from "@/hooks/use-admin";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function IntelligenceCenter() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
  const [timeRange, setTimeRange] = useState("day");
  const [filterReason, setFilterReason] = useState("all");
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Autonomous Access Control
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isAdminLoading, router]);

  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return query(
      collection(db, 'libraryVisits'),
      orderBy('checkInTime', 'desc'),
      limit(2000)
    );
  }, [db, user, isAdmin]);

  const collegesQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return collection(db, 'colleges');
  }, [db, user, isAdmin]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);
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
    let lastHourCount = 0;
    const lastHourThreshold = subHours(now, 1);

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
      if (date > lastHourThreshold) lastHourCount++;
    });

    const chartData = Object.entries(chartDataMap).map(([name, count]) => ({ name, count }));
    const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    
    const mostActiveCollege = Object.entries(collegeMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";
    const totalToday = sessions.filter(s => s.checkInTime && isSameDay(s.checkInTime.toDate(), now)).length;

    return { 
      total: filtered.length, 
      totalToday,
      lastHourCount,
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
    doc.setFontSize(18);
    doc.setTextColor(81, 151, 99); 
    doc.text("NEULibrary Operational Intelligence", 14, 25);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.visitorId || "Unknown",
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose || "General",
      s.visitorType || "Student"
    ]);

    (doc as any).autoTable({
      startY: 40,
      head: [['Identity', 'Unit', 'Timestamp', 'Activity', 'Class']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [81, 151, 99], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
    });

    doc.save(`NEULIBRARY_REPORT_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full p-8 text-center space-y-4 rounded-[2rem] border-none shadow-xl">
          <KeyRound className="h-12 w-12 text-destructive mx-auto opacity-20" />
          <h2 className="text-2xl font-black uppercase italic">Access Denied</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">Admin Credentials Required</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <NavBar />
      <main className="container mx-auto py-10 px-6 max-w-7xl space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Intelligence <span className="text-primary not-italic">Center</span>
            </h1>
            <p className="text-muted-foreground font-black text-[9px] uppercase tracking-[0.4em] opacity-40">
              Institutional Behavioral Analytics
            </p>
          </div>
          <Button onClick={generateReport} className="h-12 px-6 rounded-xl bg-primary text-white shadow-lg hover:scale-105 transition-all font-black uppercase tracking-widest text-[9px]">
            <FileDown className="mr-2 h-4 w-4" />
            Audit Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Today's Traffic", val: stats?.totalToday || 0, icon: UsersRound, color: "bg-primary" },
            { label: "Recent Occupancy", val: stats?.lastHourCount || 0, icon: Clock, color: "bg-accent" },
            { label: "Active Unit", val: stats?.mostActiveCollege, icon: Building2, color: "bg-primary", isText: true },
            { label: "Staff : Student", val: `${stats?.staffCount} : ${stats?.studentCount}`, icon: TrendingUp, color: "bg-primary", isRatio: true }
          ].map((item, i) => (
            <Card key={i} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className={`h-2 ${item.color} w-full`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                    <h3 className={`font-black text-foreground ${item.isText ? 'text-xl' : 'text-4xl'} uppercase italic`}>{item.val}</h3>
                  </div>
                  <div className="h-14 w-14 bg-muted/30 rounded-2xl flex items-center justify-center">
                    <item.icon className={`h-7 w-7 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Hub */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white/60 backdrop-blur-md overflow-hidden border-2 border-white">
          <CardHeader className="p-8 pb-4 border-b border-muted/20">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <Filter className="h-4 w-4 text-accent" /> Intelligence Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Timeframe", value: timeRange, setter: setTimeRange, options: [
                { v: "day", l: "Today" }, { v: "week", l: "This Week" }, { v: "month", l: "This Month" }
              ]},
              { label: "Academic Unit", value: filterCollege, setter: setFilterCollege, options: [
                { v: "all", l: "All Units" },
                ...(colleges?.map(c => ({ v: c.name, l: c.name })) || [])
              ]},
              { label: "Objective", value: filterReason, setter: setFilterReason, options: [
                { v: "all", l: "All Activities" },
                { v: "Research", l: "Research" },
                { v: "Individual Study", l: "Study" },
                { v: "Group Project", l: "Projects" }
              ]},
              { label: "Class", value: filterType, setter: setFilterType, options: [
                { v: "all", l: "All Classes" },
                { v: "Student", l: "Student" },
                { v: "Staff", l: "Staff" }
              ]}
            ].map((f, i) => (
              <div key={i} className="space-y-2">
                <label className="text-[8px] font-black uppercase opacity-40 ml-1 tracking-widest">{f.label}</label>
                <Select value={f.value} onValueChange={f.setter}>
                  <SelectTrigger className="h-10 rounded-xl border border-muted bg-white font-black text-[10px] uppercase tracking-widest px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    {f.options.map(o => (
                      <SelectItem key={o.v} value={o.v} className="font-bold py-2 uppercase text-[9px]">{o.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Charts Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 border-4 border-white">
            <CardHeader className="pb-8 text-center">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3">
                <Activity className="h-6 w-6 text-primary" /> Temporal Density
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} fontWeight="900" tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: '#f7f7f7', radius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 border-4 border-white">
            <CardHeader className="pb-8 text-center">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3">
                <PieIcon className="h-6 w-6 text-accent" /> Objective Vectors
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
