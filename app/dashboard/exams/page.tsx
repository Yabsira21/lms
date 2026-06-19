"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  FileText,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  ExternalLink,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  passingScore: number | null;
  _count?: {
    questions: number;
  };
}

interface Submission {
  id: string;
  status: string;
  score: number;
  totalPoints: number;
  percentage: number;
  flagged: boolean;
  violationCount: number;
  startedAt: string;
  submittedAt: string | null;
  exam: Exam;
}

export default function UserExamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState<Submission[]>([]);
  const [completed, setCompleted] = useState<Submission[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [examCode, setExamCode] = useState("");
  const [joiningExam, setJoiningExam] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      const res = await fetch("/api/user/exams");
      if (res.ok) {
        const data = await res.json();
        setInProgress(data.inProgress);
        setCompleted(data.completed);
        setAvailableExams(data.availableExams);
      } else {
        toast.error("Failed to load exams");
      }
      setLoading(false);
    };
    fetchExams();
  }, []);

  const handleJoinByCode = async () => {
    if (!examCode.trim()) {
      toast.error("Please enter an exam code");
      return;
    }

    setJoiningExam(true);
    try {
      // First check if exam exists
      const res = await fetch(`/api/exam/${examCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasSubmitted) {
          toast.error("You have already completed this exam");
          router.push(`/exam/${examCode}/results`);
        } else if (data.existingSubmission) {
          router.push(`/exam/${examCode}/take`);
        } else {
          router.push(`/exam/${examCode}`);
        }
      } else {
        toast.error("Exam not found. Please check the code and try again.");
      }
    } catch (error) {
      toast.error("Failed to join exam");
    } finally {
      setJoiningExam(false);
      setJoinDialogOpen(false);
      setExamCode("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col items-center px-4 lg:px-8">
      <div className="w-full max-w-6xl flex flex-col gap-4 py-6 md:gap-8 md:py-8">
        <section className="mt-10">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
                <p className="text-muted-foreground mt-1">
                  Take exams, track your progress, and review results
                </p>
              </div>
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Search className="h-4 w-4" />
                    Join by Exam Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join an Exam</DialogTitle>
                    <DialogDescription>
                      Enter the exam code provided by your instructor to take
                      the exam.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="exam-code">Exam Code</Label>
                    <Input
                      id="exam-code"
                      placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      The exam code is the unique ID of the exam. Ask your
                      instructor for the code.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setJoinDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleJoinByCode} disabled={joiningExam}>
                      {joiningExam ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Joining...
                        </>
                      ) : (
                        "Join Exam"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="available" className="space-y-6">
              <TabsList>
                <TabsTrigger value="available">
                  Available Exams ({availableExams.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  In Progress ({inProgress.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completed.length})
                </TabsTrigger>
              </TabsList>

              {/* Available Exams Tab */}
              <TabsContent value="available" className="space-y-4">
                {availableExams.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <p className="text-lg font-medium">No available exams</p>
                      <p className="text-muted-foreground text-center">
                        You've taken all available exams or none are published
                        yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableExams.map((exam) => (
                      <Card
                        key={exam.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <CardTitle className="line-clamp-1">
                            {exam.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {exam.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center mb-4 text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>
                                  {exam._count?.questions || 0} questions
                                </span>
                              </div>
                              {exam.duration && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{exam.duration} min</span>
                                </div>
                              )}
                            </div>
                            {exam.passingScore && (
                              <Badge variant="outline">
                                Pass: {exam.passingScore}%
                              </Badge>
                            )}
                          </div>
                          <Link
                            href={`/exam/${exam.id}`}
                            className={buttonVariants({
                              className: "w-full gap-2",
                            })}
                          >
                            <PlayCircle className="h-4 w-4" />
                            Start Exam
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* In Progress Tab */}
              <TabsContent value="in-progress" className="space-y-4">
                {inProgress.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">
                        No exams in progress
                      </p>
                      <p className="text-muted-foreground">
                        Start an exam from the "Available Exams" tab.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inProgress.map((submission) => (
                      <Card
                        key={submission.id}
                        className="border-yellow-200 bg-yellow-50/30"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="line-clamp-1">
                              {submission.exam.title}
                            </CardTitle>
                            <Badge variant="outline" className="bg-yellow-100">
                              In Progress
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {submission.exam.description || "No description"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>
                                Started:{" "}
                                {format(
                                  new Date(submission.startedAt),
                                  "MMM d, h:mm a",
                                )}
                              </span>
                              {submission.exam.duration && (
                                <span>
                                  Duration: {submission.exam.duration} min
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/exam/${submission.exam.id}/take`}
                              className={buttonVariants({
                                className:
                                  "w-full gap-2 bg-yellow-600 hover:bg-yellow-700",
                              })}
                            >
                              <PlayCircle className="h-4 w-4" />
                              Continue Exam
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Completed Exams Tab */}
              <TabsContent value="completed" className="space-y-4">
                {completed.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No completed exams</p>
                      <p className="text-muted-foreground">
                        Your exam results will appear here once you complete an
                        exam.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completed.map((submission) => {
                      const passed =
                        submission.percentage >=
                        (submission.exam.passingScore || 60);
                      return (
                        <Card
                          key={submission.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="line-clamp-1">
                                {submission.exam.title}
                              </CardTitle>
                              <Badge variant={passed ? "default" : "secondary"}>
                                {passed ? "Passed" : "Failed"}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {submission.exam.description || "No description"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <div className="text-center">
                                  <p className="text-2xl font-bold">
                                    {submission.score}/{submission.totalPoints}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Score
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p
                                    className={`text-2xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {submission.percentage.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Percentage
                                  </p>
                                </div>
                                {submission.flagged && (
                                  <div className="text-center">
                                    <Flag className="h-5 w-5 text-red-500 mx-auto" />
                                    <p className="text-xs text-muted-foreground">
                                      Flagged
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>
                                  Completed:{" "}
                                  {format(
                                    new Date(submission.submittedAt!),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              </div>
                              <Link
                                href={`/exam/${submission.exam.id}/results`}
                                className={buttonVariants({
                                  variant: "outline",
                                  className: "w-full gap-2",
                                })}
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Results
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
