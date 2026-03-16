
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileDown, TrendingUp, Filter, PieChart as PieIcon, 
  Activity, Building2, Clock, UsersRound, Loader2, Calendar as CalendarIcon,
  Table as TableIcon, Users, ArrowRight
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subHours } from "date-fns";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAdmin } from "@/hooks/use-admin";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import Link from "next/link";

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
 * @fileOverview Intelligence Center - High-fidelity behavioral analytics dashboard.
 */
export default function IntelligenceCenter() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
  
  // Filtering State
  const [timeRange, setTimeRange] = useState("day");
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [filterReason, setFilterReason] = useState("all");
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterClass, setFilterClass] = useState("all"); 

  // Access Control
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

  const reasonsQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return collection(db, 'reasonsForVisit');
  }, [db, user, isAdmin]);

  const collegesQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return collection(db, 'colleges');
  }, [db, user, isAdmin]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);
  const { data: dynamicColleges } = useCollection(collegesQuery);
  const { data: visitReasons } = useCollection(reasonsQuery);

  // Sync DateRange with Quick Presets
  useEffect(() => {
    const now = new Date();
    if (timeRange === "day") {
      setDate({ from: startOfDay(now), to: endOfDay(now) });
    } else if (timeRange === "week") {
      setDate({ from: startOfWeek(now), to: endOfWeek(now) });
    } else if (timeRange === "month") {
      setDate({ from: startOfMonth(now), to: endOfMonth(now) });
    }
  }, [timeRange]);

  const stats = useMemo(() => {
    if (!sessions || !date?.from) return null;

    const filtered = sessions.filter(s => {
      if (!s.checkInTime) return false;
      const checkInDate = s.checkInTime.toDate();
      
      const inRange = isWithinInterval(checkInDate, { 
        start: date.from!, 
        end: date.to || endOfDay(date.from!) 
      });
      
      const matchesReason = filterReason === "all" || s.purpose === filterReason;
      const matchesCollege = filterCollege === "all" || s.collegeOrOffice === filterCollege;
      
      let matchesClass = true;
      if (filterClass === "Student") matchesClass = s.visitorType === "Student";
      if (filterClass === "Employee") matchesClass = ["Teacher", "Staff"].includes(s.visitorType);

      return inRange && matchesReason && matchesCollege && matchesClass;
    });

    const chartDataMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const collegeMap: Record<string, number> = {};
    let employeeCount = 0;
    let studentCount = 0;
    let lastHourCount = 0;
    const lastHourThreshold = subHours(new Date(), 1);

    filtered.forEach(s => {
      const d = s.checkInTime.toDate();
      const key = timeRange === "day" ? format(d, "HH:00") : format(d, "MMM dd");
      chartDataMap[key] = (chartDataMap[key] || 0) + 1;
      
      purposeMap[s.purpose] = (purposeMap[s.purpose] || 0) + 1;
      collegeMap[s.collegeOrOffice] = (collegeMap[s.collegeOrOffice] || 0) + 1;

      if (["Teacher", "Staff"].includes(s.visitorType)) employeeCount++;
      if (s.visitorType === "Student") studentCount++;
      if (d > lastHourThreshold) lastHourCount++;
    });

    const chartData = Object.entries(chartDataMap).map(([name, count]) => ({ name, count }));
    const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const activeUnit = Object.entries(collegeMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    return { 
      total: filtered.length,
      lastHourCount,
      chartData, 
      pieData, 
      filteredSessions: filtered,
      employeeCount,
      studentCount,
      activeUnit
    };
  }, [sessions, date, filterReason, filterCollege, filterClass, timeRange]);

  const CHART_COLORS = ['#0F172A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const generateReport = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); 
    doc.text("NEULibrary Access Intelligence Report", 14, 25);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    const rangeStr = date?.from ? `${format(date.from, "PP")} - ${format(date.to || date.from, "PP")}` : "Custom Range";
    doc.text(`Period: ${rangeStr}`, 14, 32);

    const tableData = stats.filteredSessions.map(s => [
      s.visitorName || "N/A",
      s.visitorId || "N/A",
      s.collegeOrOffice || "N/A",
      format(s.checkInTime.toDate(), "PPpp"),
      s.purpose || "N/A",
      s.visitorType || "N/A"
    ]);

    (doc as any).autoTable({
      startY: 40,
      head: [['Visitor', 'ID', 'Unit', 'Time', 'Purpose', 'Role']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
    });

    doc.save(`NEULIBRARY_INTEL_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  if (isAdminLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
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
              Access <span className="text-primary not-italic">Intelligence</span>
            </h1>
            <p className="text-muted-foreground font-black text-[9px] uppercase tracking-[0.4em] opacity-40">
              Visitor Behavioral Management Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="h-12 px-6 rounded-xl border-2 border-primary text-primary shadow-sm font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-white transition-all">
              <Link href="/students">
                <Users className="mr-2 h-4 w-4" />
                Manage Visitors
              </Link>
            </Button>
            <Button onClick={generateReport} className="h-12 px-6 rounded-xl bg-primary text-white shadow-lg font-black uppercase tracking-widest text-[9px]">
              <FileDown className="mr-2 h-4 w-4" />
              Export Analytics
            </Button>
          </div>
        </div>

        {/* Intelligence Filters */}
        <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b bg-muted/10">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <Filter className="h-4 w-4 text-accent" /> Analysis Vectors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase opacity-40 ml-1 tracking-widest">Timeframe</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="h-10 rounded-xl border border-muted font-black text-[10px] uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day" className="text-[9px] font-black uppercase">Today</SelectItem>
                  <SelectItem value="week" className="text-[9px] font-black uppercase">This Week</SelectItem>
                  <SelectItem value="month" className="text-[9px] font-black uppercase">This Month</SelectItem>
                  <SelectItem value="custom" className="text-[9px] font-black uppercase">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase opacity-40 ml-1 tracking-widest">Custom Dates</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 rounded-xl justify-start text-left font-black text-[10px] uppercase",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</>
                      ) : (
                        format(date.from, "LLL dd")
                      )
                    ) : (
                      <span>Pick a range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      if (d) setTimeRange("custom");
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase opacity-40 ml-1 tracking-widest">Academic Unit</label>
              <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="h-10 rounded-xl border border-muted font-black text-[10px] uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all" className="text-[9px] font-black uppercase">All Units</SelectItem>
                  {ACADEMIC_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit} className="text-[9px] font-black uppercase">
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase opacity-40 ml-1 tracking-widest">Visit Purpose</label>
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="h-10 rounded-xl border border-muted font-black text-[10px] uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[9px] font-black uppercase">All Purposes</SelectItem>
                  <SelectItem value="Research" className="text-[9px] font-black uppercase">Research</SelectItem>
                  <SelectItem value="Study" className="text-[9px] font-black uppercase">Study</SelectItem>
                  {visitReasons?.map(r => (
                    <SelectItem key={r.id} value={r.name} className="text-[9px] font-black uppercase">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase opacity-40 ml-1 tracking-widest">Visitor Class</label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="h-10 rounded-xl border border-muted font-black text-[10px] uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[9px] font-black uppercase">All Visitors</SelectItem>
                  <SelectItem value="Student" className="text-[9px] font-black uppercase">Students Only</SelectItem>
                  <SelectItem value="Employee" className="text-[9px] font-black uppercase">Employees (Teachers/Staff)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Operational Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Aggregate Traffic", val: stats?.total || 0, icon: UsersRound, color: "bg-primary" },
            { label: "Live Occupancy (1h)", val: stats?.lastHourCount || 0, icon: Clock, color: "bg-accent" },
            { label: "Intensity Unit", val: stats?.activeUnit || "N/A", icon: Building2, color: "bg-primary", isText: true },
            { label: "Employee : Student", val: `${stats?.employeeCount} : ${stats?.studentCount}`, icon: TrendingUp, color: "bg-primary" }
          ].map((item, i) => (
            <Card key={i} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
              <div className={`h-2 ${item.color} w-full`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                    <h3 className={cn("font-black text-foreground uppercase italic", item.isText ? "text-xl" : "text-4xl")}>{item.val}</h3>
                  </div>
                  <div className="h-12 w-12 bg-muted/30 rounded-2xl flex items-center justify-center">
                    <item.icon className={cn("h-6 w-6", item.color.replace('bg-', 'text-'))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access CRUD Shortcut */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary text-white overflow-hidden group hover:scale-[1.01] transition-all duration-500">
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8 text-center md:text-left">
              <div className="h-20 w-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center border-2 border-white/20">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Visitor <span className="text-accent not-italic">Registry Hub</span></h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Manage identity CRUD & access termination (Blocking)</p>
              </div>
            </div>
            <Button asChild className="h-16 px-10 rounded-2xl bg-white text-primary font-black uppercase tracking-widest shadow-2xl hover:bg-accent hover:text-white transition-all">
              <Link href="/students">
                Open Registry <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Behavioral Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Activity className="h-6 w-6 text-primary" /> Temporal Density
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={9} fontStyle="italic" fontWeight="900" tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} fontWeight="900" tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: '#f7f7f7', radius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
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

        {/* Log Inspection */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b bg-muted/10">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <TableIcon className="h-6 w-6 text-primary" /> Institutional Access Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Visitor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Unit</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Time</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Purpose</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                      No Records Found in Analysis Window
                    </TableCell>
                  </TableRow>
                ) : (
                  stats?.filteredSessions.map((session) => (
                    <TableRow key={session.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="text-xs font-bold py-4">
                        <span className="uppercase italic tracking-tight">{session.visitorName || "N/A"}</span>
                      </TableCell>
                      <TableCell className="text-[10px] font-black opacity-60 tracking-widest">{session.visitorId || "N/A"}</TableCell>
                      <TableCell className="text-[10px] font-black uppercase tracking-widest text-primary/80">{session.collegeOrOffice || "N/A"}</TableCell>
                      <TableCell className="text-[10px] font-bold text-muted-foreground">
                        {session.checkInTime ? format(session.checkInTime.toDate(), "PP | hh:mm a") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/10 bg-primary/5 text-[8px] font-black py-0.5 px-2">
                          {session.purpose || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                          session.visitorType === "Student" ? "bg-accent text-white" : "bg-primary text-white"
                        )}>
                          {session.visitorType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
