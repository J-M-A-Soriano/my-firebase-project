"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileDown, TrendingUp, Loader2, Clock, Filter, ArrowRight, UserCheck, Search, Building2, Tag } from "lucide-react";
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
      collection(db, 'librarySessions'),
      orderBy('checkInTime', 'desc'),
      limit(1000)
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
      if (filterType === "employee") matchesType = s.isEmployee === true;
      if (filterType === "student") matchesType = s.isEmployee !== true;

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
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("NEU Library Intelligence Audit", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);
    doc.text(`Period: ${timeRange.toUpperCase()} | Filter: R:${filterReason} C:${filterCollege} T:${filterType}`, 14, 37);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.studentId || "Guest",
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose || "N/A"
    ]);

    (doc as any).autoTable({
      startY: 45,
      head: [['Visitor', 'Affiliation', 'Entry Time', 'Purpose']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`NEU_Intelligence_Audit_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <NavBar />
      <main className="container mx-auto py-10 px-6 max-w-7xl space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase italic">
              Intelligence <span className="text-primary not-italic">Center</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest opacity-60">
              Visitor Analytics & Behavioral Control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={generateReport} className="h-12 px-6 rounded-2xl bg-primary text-white shadow-xl hover:scale-105 transition-transform font-bold">
              <FileDown className="mr-2 h-5 w-5" />
              Intelligence PDF
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Global Analytics Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Time Horizon</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Academic Unit</label>
              <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges?.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Visit Purpose</label>
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  {reasons?.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                  <SelectItem value="Reading Books">Reading Books</SelectItem>
                  <SelectItem value="Thesis Research">Thesis Research</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Visitor Class</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profiles</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                  <SelectItem value="employee">Staff / Teachers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* High Level Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aggregate Traffic</p>
                  <h3 className="text-5xl font-black text-foreground tabular-nums">{stats?.total || 0}</h3>
                </div>
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group">
            <div className="h-2 bg-accent w-full" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Occupancy Vector</p>
                  <h3 className="text-5xl font-black text-foreground tabular-nums">
                    {sessions?.filter(s => !s.checkOutTime).length || 0}
                  </h3>
                </div>
                <div className="h-16 w-16 bg-accent/10 rounded-3xl flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl bg-primary text-white overflow-hidden">
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/20 text-white border-none font-bold">Secure Sync</Badge>
                <TrendingUp className="h-6 w-6 opacity-50" />
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Peak Intelligence</p>
                <h3 className="text-2xl font-black italic uppercase">
                  {stats?.chartData.sort((a,b) => b.count - a.count)[0]?.name || "Calculating..."}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-4">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-black uppercase italic">Temporal Distribution</CardTitle>
              <CardDescription className="font-bold">Hourly visitor intensity analysis</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} fontWeight="black" tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-4">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-black uppercase italic">Purpose Breakdown</CardTitle>
              <CardDescription className="font-bold">Primary academic objectives</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black uppercase">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black uppercase italic">Live Activity Feed</CardTitle>
              <Badge className="bg-primary/5 text-primary border-none font-black px-4 py-1">REAL-TIME</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[600px] overflow-auto custom-scrollbar">
                {stats?.filteredSessions.map((session: any) => (
                  <div key={session.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-primary/20">
                        {session.visitorName?.charAt(0) || "V"}
                      </div>
                      <div>
                        <p className="font-black text-lg leading-none">{session.visitorName || "Guest"}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{session.collegeOrOffice}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-black text-[10px] uppercase">
                        {session.purpose}
                      </Badge>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-50 flex items-center justify-end gap-1.5">
                        <Clock className="h-3 w-3" />
                        {format(session.checkInTime.toDate(), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                {stats?.filteredSessions.length === 0 && (
                  <div className="p-20 text-center opacity-40 font-black uppercase tracking-widest">No Intelligence Vectors Found</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
