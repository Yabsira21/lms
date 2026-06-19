"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface SubmissionDetail {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  flagged: boolean;
  violationCount: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, { answer: string; correct: boolean; points: number }>;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  exam: {
    id: string;
    title: string;
    passingScore: number | null;
  };
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    points: number;
    order: number;
  }>;
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      const res = await fetch(
        `/api/admin/exams/${examId}/submissions/${submissionId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
      } else {
        router.push(`/admin/exams/${examId}`);
      }
      setLoading(false);
    };
    fetchSubmission();
  }, [examId, submissionId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!submission) return null;

  const passed = submission.percentage >= (submission.exam.passingScore || 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/exams/${examId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Submission Details</h1>
          <p className="text-muted-foreground">
            {submission.exam.title} - {submission.user.name}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {submission.user.image ? (
              <AvatarImage src={submission.user.image} />
            ) : null}
            <AvatarFallback className="text-lg">
              {submission.user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{submission.user.name}</p>
            <p className="text-muted-foreground">{submission.user.email}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-sm">
                Started:{" "}
                {format(new Date(submission.startedAt), "MMM d, h:mm a")}
              </span>
              <span className="text-sm">
                Submitted:{" "}
                {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">
                {submission.score} / {submission.totalPoints}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p
                className={`text-2xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}
              >
                {submission.percentage.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Status</p>
              {submission.flagged ? (
                <Badge variant="destructive" className="mt-1">
                  Flagged
                </Badge>
              ) : passed ? (
                <Badge className="mt-1 bg-green-500">Passed</Badge>
              ) : (
                <Badge variant="secondary" className="mt-1 bg-red-500">
                  Failed
                </Badge>
              )}
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Violations</p>
              <p
                className={`text-2xl font-bold ${submission.violationCount >= 3 ? "text-red-600" : "text-yellow-600"}`}
              >
                {submission.violationCount}/3
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers Review */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {submission.questions.map((question, index) => {
              const userAnswer = submission.answers[question.id];
              const isCorrect = userAnswer?.correct || false;
              const correctAnswerLetter = String.fromCharCode(
                65 +
                  question.options.findIndex(
                    (opt) => opt === question.correctAnswer,
                  ),
              );

              return (
                <div key={question.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">
                      Question {index + 1}: {question.text}
                    </h3>
                    <Badge
                      variant={isCorrect ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {isCorrect ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {userAnswer?.points || 0} / {question.points} pts
                    </Badge>
                  </div>

                  <div className="space-y-2 ml-4">
                    {question.options.map((option, optIndex) => {
                      const letter = String.fromCharCode(65 + optIndex);
                      const isUserSelected = userAnswer?.answer === option;
                      const isCorrectAnswer = option === question.correctAnswer;

                      let bgColor = "";
                      if (isCorrectAnswer) {
                        bgColor = "border-green-200";
                      } else if (isUserSelected && !isCorrectAnswer) {
                        bgColor = "border-red-200";
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded border ${bgColor}`}
                        >
                          <span className="w-8 text-sm font-medium">
                            {letter}.
                          </span>
                          <span className="flex-1">{option}</span>
                          {isCorrectAnswer && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {isUserSelected && !isCorrectAnswer && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {userAnswer?.answer && !isCorrect && (
                    <div className="mt-2 text-sm text-muted-foreground ml-4">
                      Your answer: {userAnswer.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
