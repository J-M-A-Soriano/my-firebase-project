
"use client";

import { useState, useMemo } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileDown, TrendingUp, Calendar as CalendarIcon, Loader2, Clock, Filter } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
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

    // Chart Data - Hourly or Daily
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

  const COLORS = ['#1a5d1a', '#a1e070', '#568b56', '#e2f4d6', '#0f3c0f'];

  const generateReport = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("NEU Library Visitor Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Range: ${timeRange.toUpperCase()} | Generated: ${format(new Date(), "PPpp")}`, 14, 30);
    doc.text(`Total Visitors: ${stats.total}`, 14, 38);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || s.studentId,
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose
    ]);

    (doc as any).autoTable({
      startY: 45,
      head: [['Visitor', 'College/Office', 'Time', 'Purpose']],
      body: tableData,
    });

    doc.save(`NEU_Library_Report_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Library Management Dashboard</h1>
            <p className="text-muted-foreground">Monitoring NEU Library visitor traffic and statistics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateReport} className="bg-primary shadow-md">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Visitors</p>
                  <h3 className="text-3xl font-bold">{stats?.total || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Sessions</p>
                  <h3 className="text-3xl font-bold">
                    {sessions?.filter(s => !s.checkOutTime).length || 0}
                  </h3>
                </div>
                <div className="p-3 bg-accent/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Report Period</p>
                  <h3 className="text-lg font-bold">{format(new Date(), "MMMM yyyy")}</h3>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Live Syncing
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Visitor Flow Pattern</CardTitle>
              <CardDescription>Frequency of visits over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Purpose of Visit</CardTitle>
              <CardDescription>Breakdown by selected activity</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>Real-time entry activity feed</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/students" className="text-xs">Manage Visitors</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-auto">
                {stats?.filteredSessions.map((session: any) => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {session.visitorName?.charAt(0) || "V"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{session.visitorName || "Guest"}</p>
                        <p className="text-xs text-muted-foreground">{session.collegeOrOffice}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">{session.purpose}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(session.checkInTime.toDate(), "HH:mm a")}
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
