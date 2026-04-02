"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  passingScore: number | null;
  status: string;
  createdAt: string;
  questions: Question[];
}

interface Submission {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  flagged: boolean;
  violationCount: number;
  status: string;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      const [examRes, submissionsRes] = await Promise.all([
        fetch(`/api/admin/exams/${examId}`),
        fetch(`/api/admin/exams/${examId}/submissions`),
      ]);

      if (examRes.ok) {
        const examData = await examRes.json();
        setExam(examData);
      } else {
        router.push("/admin/exams");
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [examId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) return null;

  const totalSubmissions = submissions.length;
  const flaggedSubmissions = submissions.filter((s) => s.flagged).length;
  const averageScore =
    submissions.length > 0
      ? submissions.reduce((sum, s) => sum + s.percentage, 0) /
        submissions.length
      : 0;
  const passRate = submissions.filter(
    (s) => s.percentage >= (exam.passingScore || 60),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          <p className="text-muted-foreground mt-1">
            {exam.description || "No description provided"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/exams/${examId}/edit`}
            className={buttonVariants({
              variant: "outline",
              className: "gap-2",
            })}
          >
            <Edit className="h-4 w-4" />
            Edit Exam
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Submissions
                </p>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged Exams</p>
                <p className="text-2xl font-bold text-red-500">
                  {flaggedSubmissions}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">
                  {totalSubmissions > 0
                    ? ((passRate / totalSubmissions) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    exam.status === "Published" ? "default" : "secondary"
                  }
                >
                  {exam.status}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Duration</span>
                <span>
                  {exam.duration ? `${exam.duration} minutes` : "No time limit"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Passing Score</span>
                <span>
                  {exam.passingScore ? `${exam.passingScore}%` : "Not set"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Questions</span>
                <span>{exam.questions.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Points</span>
                <span>
                  {exam.questions.reduce((sum, q) => sum + q.points, 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Created At</span>
                <span>{format(new Date(exam.createdAt), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Exam Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {exam.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border-b pb-4 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">
                        Question {index + 1}: {question.text}
                      </h3>
                      <Badge variant="outline">{question.points} pts</Badge>
                    </div>
                    <div className="space-y-1 ml-4">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded ${
                            option === question.correctAnswer
                              ? "border border-green-200"
                              : ""
                          }`}
                        >
                          <span className="w-8 text-sm font-medium">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <span>{option}</span>
                          {option === question.correctAnswer && (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No submissions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Violations</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => {
                      const passed =
                        submission.percentage >= (exam.passingScore || 60);
                      return (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {submission.user.image ? (
                                  <AvatarImage src={submission.user.image} />
                                ) : null}
                                <AvatarFallback>
                                  {submission.user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {submission.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {submission.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission.score} / {submission.totalPoints}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                passed ? "text-green-600" : "text-red-600"
                              }
                            >
                              {submission.percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {submission.flagged ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Flagged
                              </Badge>
                            ) : passed ? (
                              <Badge
                                variant="default"
                                className="gap-1 bg-green-500"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Passed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                submission.violationCount >= 3
                                  ? "text-red-600 font-bold"
                                  : "text-yellow-600"
                              }
                            >
                              {submission.violationCount}/3
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {submission.submittedAt
                              ? format(
                                  new Date(submission.submittedAt),
                                  "MMM d, h:mm a",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/exams/${examId}/submissions/${submission.id}`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                              })}
                            >
                              View Details
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
