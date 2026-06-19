'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Download, Search, Users, CheckCircle2, XCircle,
  Clock, Calendar, FileText, ChevronLeft, ChevronRight,
  RefreshCw, AlertTriangle, Eye
} from 'lucide-react';
import Link from 'next/link';

interface IntervalRecord {
  intervalIndex: number;
  status: 'VERIFIED' | 'UNVERIFIED';
  confidence: number | null;
  timestamp: string;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
  attendanceStatus: 'Present' | 'Absent' | 'Late';
  verified: boolean;
  confidence: number;
  joinTime: string | null;
  verifiedPct: number;
  totalIntervals: number;
  verifiedIntervals: number;
}

interface AttendanceMonitoringProps {
  session: any;
}

// ─── Timeline component ──────────────────────────────────────────────────────
function AttendanceTimeline({ intervals, totalIntervals }: { intervals: IntervalRecord[]; totalIntervals: number }) {
  const slots = Array.from({ length: Math.max(totalIntervals, intervals.length) }, (_, i) => {
    const rec = intervals.find(r => r.intervalIndex === i);
    return rec ?? null;
  });

  if (slots.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No interval data yet.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {slots.map((slot, i) => {
          const color =
            slot === null          ? 'bg-muted'   :
            slot.status === 'VERIFIED' ? 'bg-green-500' : 'bg-red-500';
          const label =
            slot === null          ? 'No data'       :
            slot.status === 'VERIFIED'
              ? `Min ${i + 1}: Verified (${slot.confidence !== null ? Math.round(slot.confidence * 100) : '?'}%)`
              : `Min ${i + 1}: UNVERIFIED`;

          return (
            <div
              key={i}
              title={label}
              className={`h-5 w-5 rounded-sm ${color} cursor-default transition-colors`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Verified</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Unverified</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted inline-block" /> No data</span>
      </div>
    </div>
  );
}

// ─── Student detail dialog ───────────────────────────────────────────────────
function StudentDetailDialog({
  student,
  classId,
  open,
  onClose,
}: {
  student: StudentRow | null;
  classId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [intervals, setIntervals] = useState<IntervalRecord[]>([]);
  const [summary, setSummary] = useState<{ totalIntervals: number; verifiedIntervals: number; verifiedPct: number; isPresent: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIntervals = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/interval?classId=${classId}&userId=${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setIntervals(data.intervals);
        setSummary(data.summary);
      }
    } finally {
      setLoading(false);
    }
  }, [student, classId]);

  useEffect(() => {
    if (open) fetchIntervals();
  }, [open, fetchIntervals]);

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={student.image ?? undefined} />
              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{student.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{student.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Summary stats */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-2xl font-bold">{summary.totalIntervals}</p>
                <p className="text-xs text-muted-foreground">Total Intervals</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 border border-green-200/70 dark:border-green-900 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{summary.verifiedIntervals}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${summary.verifiedPct >= 75 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                <p className={`text-2xl font-bold ${summary.verifiedPct >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.verifiedPct}%
                </p>
                <p className="text-xs text-muted-foreground">Verified Rate</p>
              </div>
            </div>
          )}

          {/* Final status */}
          {summary && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${summary.isPresent ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {summary.isPresent
                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                : <XCircle className="h-5 w-5 text-red-600" />}
              <div>
                <p className={`font-semibold text-sm ${summary.isPresent ? 'text-green-700' : 'text-red-700'}`}>
                  {summary.isPresent ? 'Formally Present' : 'Formally Absent'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.isPresent
                    ? `≥ 75% verified intervals — attendance confirmed`
                    : `< 75% verified intervals — below threshold`}
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Minute-by-Minute Timeline</p>
              <Button variant="ghost" size="sm" onClick={fetchIntervals} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AttendanceTimeline intervals={intervals} totalIntervals={summary?.totalIntervals ?? 0} />
            )}
          </div>

          {/* Unverified timestamps */}
          {intervals.filter(i => i.status === 'UNVERIFIED').length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Flagged Intervals
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {intervals
                  .filter(i => i.status === 'UNVERIFIED')
                  .map(i => (
                    <div key={i.intervalIndex} className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900 rounded px-3 py-1.5">
                      <span className="text-red-700 font-medium">Minute {i.intervalIndex + 1}</span>
                      <span className="text-muted-foreground">{new Date(i.timestamp).toLocaleTimeString()}</span>
                      <Badge variant="destructive" className="text-xs py-0">UNVERIFIED</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AttendanceMonitoring({ session }: AttendanceMonitoringProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [intervalData, setIntervalData] = useState<Record<string, { verifiedPct: number; totalIntervals: number; verifiedIntervals: number }>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  // Fetch interval summaries for all students
  const fetchAllIntervals = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const studentIds: string[] = session.liveClass.enrollments.map((e: any) => e.user.id);
      const results = await Promise.all(
        studentIds.map(async (uid) => {
          try {
            const res = await fetch(`/api/attendance/interval?classId=${session.id}&userId=${uid}`);
            if (!res.ok) return { uid, data: null };
            const data = await res.json();
            return { uid, data: data.summary };
          } catch {
            return { uid, data: null };
          }
        })
      );
      const map: typeof intervalData = {};
      results.forEach(({ uid, data }) => {
        if (data) map[uid] = data;
      });
      setIntervalData(map);
    } finally {
      setIsRefreshing(false);
    }
  }, [session.id, session.liveClass.enrollments]);

  useEffect(() => {
    fetchAllIntervals();
    const interval = setInterval(fetchAllIntervals, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAllIntervals]);

  // Build student rows
  const allStudents: StudentRow[] = useMemo(() => {
    return session.liveClass.enrollments.map((enrollment: any) => {
      const attendance = session.Attendance.find((att: any) => att.userId === enrollment.user.id);
      const iData = intervalData[enrollment.user.id];

      const verifiedPct   = iData?.verifiedPct   ?? (attendance?.verified ? 100 : 0);
      const totalIntervals = iData?.totalIntervals ?? 0;
      const verifiedIntervals = iData?.verifiedIntervals ?? 0;

      const isPresent = verifiedPct >= 75;

      return {
        id: enrollment.user.id,
        name: enrollment.user.name,
        email: enrollment.user.email,
        image: enrollment.user.image,
        attendanceStatus: isPresent ? 'Present' : attendance ? 'Late' : 'Absent',
        verified: isPresent,
        confidence: attendance?.confidence ?? 0,
        joinTime: attendance?.recognizedAt ?? null,
        verifiedPct,
        totalIntervals,
        verifiedIntervals,
      } as StudentRow;
    });
  }, [session, intervalData]);

  const stats = useMemo(() => {
    const total   = allStudents.length;
    const present = allStudents.filter(s => s.attendanceStatus === 'Present').length;
    const absent  = allStudents.filter(s => s.attendanceStatus === 'Absent').length;
    const late    = allStudents.filter(s => s.attendanceStatus === 'Late').length;
    return { total, present, absent, late, attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.attendanceStatus.toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allStudents, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = async (format: string) => {
    if (format === 'CSV') {
      window.open(`/api/attendance/export?classId=${session.id}&format=csv`, '_blank');
    } else {
      alert(`${format} export coming soon.`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href={`/session/${session.id}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Session
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Attendance Monitoring</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAllIntervals} disabled={isRefreshing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                    <Download className="h-4 w-4" />
                    Export Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('CSV')}>
                    <FileText className="h-4 w-4 mr-2" />CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('PDF')}>
                    <FileText className="h-4 w-4 mr-2" />PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Class Info */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{session.liveClass.title}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{session.title}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(session.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {session.endTime && ` – ${new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                </div>
              </div>
              {session.status === 'Scheduled' && (
                <Badge variant="secondary">Not Started</Badge>
              )}
              {session.status === 'Ongoing' && (
                <Badge className="bg-green-500 animate-pulse">Ongoing</Badge>
              )}
              {session.status === 'Paused' && (
                <Badge className="bg-yellow-500">Paused</Badge>
              )}
              {(session.status === 'Completed' || session.status === 'Cancelled') && (
                <Badge variant="destructive">Session Ended</Badge>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
            { label: 'Present (≥75%)', value: stats.present, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950/30' },
            { label: 'Absent', value: stats.absent, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/30' },
            { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950/30' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </div>
                <div className={`h-11 w-11 rounded-full ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Live indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-medium">Real-Time Monitoring</span>
          <span className="text-muted-foreground">· 75% threshold · 1-min intervals · 3-strike buffer</span>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b">
                <tr>
                  {['Student', 'Verified %', 'Intervals', 'Timeline', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {paginatedStudents.map(student => (
                  <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.image ?? undefined} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Verified % */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${student.verifiedPct >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${student.verifiedPct}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${student.verifiedPct >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {student.verifiedPct}%
                        </span>
                      </div>
                    </td>

                    {/* Intervals */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {student.verifiedIntervals}/{student.totalIntervals}
                    </td>

                    {/* Mini timeline */}
                    <td className="px-5 py-4">
                      <div className="flex gap-0.5 flex-wrap max-w-[120px]">
                        {Array.from({ length: student.totalIntervals }, (_, i) => {
                          // We don't have per-interval data here — use verifiedPct as approximation
                          // Full data is in the dialog
                          return (
                            <div
                              key={i}
                              className="w-2.5 h-2.5 rounded-sm bg-muted"
                              title={`Interval ${i + 1}`}
                            />
                          );
                        })}
                        {student.totalIntervals === 0 && (
                          <span className="text-xs text-muted-foreground">No data</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {student.attendanceStatus === 'Present' && (
                        <Badge className="bg-green-600 hover:bg-green-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" />Present
                        </Badge>
                      )}
                      {student.attendanceStatus === 'Absent' && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />Absent
                        </Badge>
                      )}
                      {student.attendanceStatus === 'Late' && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300 gap-1">
                          <Clock className="h-3 w-3" />Late
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Timeline
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Student detail dialog with full timeline */}
      <StudentDetailDialog
        student={selectedStudent}
        classId={session.id}
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
