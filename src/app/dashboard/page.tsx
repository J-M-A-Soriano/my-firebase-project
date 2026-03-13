"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileDown, TrendingUp, Calendar as CalendarIcon, Loader2, Clock, Filter, ArrowRight, UserCheck } from "lucide-react";
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
import jsPDF from "jsPDF";
import "jspdf-autotable";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState("day");

  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'librarySessions'),
      orderBy('checkInTime', 'desc'),
      limit(500)
    );
  }, [db, user]);

  const { data: sessions, isLoading } = useCollection(sessionsQuery);

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
      return isWithinInterval(date, rangeInterval);
    });

    const chartDataMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};

    filtered.forEach(s => {
      const date = s.checkInTime.toDate();
      const key = timeRange === "day" ? format(date, "HH:00") : format(date, "EEE dd");
      chartDataMap[key] = (chartDataMap[key] || 0) + 1;
      purposeMap[s.purpose] = (purposeMap[s.purpose] || 0) + 1;
    });

    const chartData = Object.entries(chartDataMap).map(([name, count]) => ({ name, count }));
    const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));

    return { total: filtered.length, chartData, pieData, filteredSessions: filtered };
  }, [sessions, timeRange]);

  const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#2563eb'];

  const generateReport = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Navy Blue
    doc.text("NEU Library Analytics Report", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);
    doc.text(`Reporting Range: ${timeRange.toUpperCase()}`, 14, 37);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Summary Statistics:`, 14, 48);
    doc.setFontSize(10);
    doc.text(`- Total Visitors in Period: ${stats.total}`, 18, 55);
    doc.text(`- Peak Activity Hour: ${stats.chartData.sort((a,b) => b.count - a.count)[0]?.name || "N/A"}`, 18, 62);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.studentId,
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose
    ]);

    (doc as any).autoTable({
      startY: 70,
      head: [['Visitor Name', 'Affiliation', 'Entry Timestamp', 'Activity Purpose']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: [15, 23, 42] },
    });

    doc.save(`NEU_Library_Report_${format(new Date(), "yyyyMMdd")}.pdf`);
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
              Live Visitor Traffic & Resource Monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 h-12 rounded-2xl border-2 font-bold bg-white">
                <Filter className="h-4 w-4 mr-2 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateReport} className="h-12 px-6 rounded-2xl bg-primary text-white shadow-xl hover:scale-105 transition-transform font-bold">
              <FileDown className="mr-2 h-5 w-5" />
              Download Audit PDF
            </Button>
          </div>
        </div>

        {/* High Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Period Visitors</p>
                  <h3 className="text-5xl font-black text-foreground tabular-nums group-hover:scale-110 transition-transform origin-left">{stats?.total || 0}</h3>
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
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Currently Active</p>
                  <h3 className="text-5xl font-black text-foreground tabular-nums group-hover:scale-110 transition-transform origin-left">
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
                <Badge className="bg-white/20 text-white border-none font-bold">Libriguard Sync</Badge>
                <TrendingUp className="h-6 w-6 opacity-50" />
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Health</p>
                <h3 className="text-2xl font-black italic uppercase">Optimal Performance</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-4">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-black uppercase italic">Traffic Flow</CardTitle>
              <CardDescription className="font-bold">Student visit frequency analysis</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={11} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={11} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-4">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-black uppercase italic">Activity Breakdown</CardTitle>
              <CardDescription className="font-bold">Purpose of library usage</CardDescription>
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
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-muted-foreground uppercase">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase italic">Live Activity Feed</CardTitle>
                <CardDescription className="font-bold">Real-time terminal transaction log</CardDescription>
              </div>
              <Button variant="outline" className="rounded-xl border-2 font-bold px-6" asChild>
                <Link href="/students">
                  Manage Directory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[600px] overflow-auto custom-scrollbar">
                {stats?.filteredSessions.map((session: any) => (
                  <div key={session.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl border-2 border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                        {session.visitorName?.charAt(0) || "V"}
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-lg text-foreground leading-none">{session.visitorName || "Guest Visitor"}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{session.collegeOrOffice}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg">
                        {session.purpose}
                      </Badge>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-50 flex items-center justify-end gap-1.5">
                        <Clock className="h-3 w-3" />
                        {format(session.checkInTime.toDate(), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}