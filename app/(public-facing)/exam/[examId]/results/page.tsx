"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Home,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface QuestionResult {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  points: number;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface ResultData {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  flagged: boolean;
  violationCount: number;
  submittedAt: string;
  exam: {
    id: string;
    title: string;
    description: string | null;
    passingScore: number | null;
  };
  questions: QuestionResult[];
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.examId as string;

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setError("Invalid exam ID");
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/exam/${examId}/results`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Results not found. Please complete the exam first.");
          } else {
            setError("Failed to load results");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log("Results data:", data); // Debug log

        if (!data || !data.exam) {
          setError("Invalid results data");
        } else {
          setResult(data);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        setError("An error occurred while loading results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Loading your results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Results Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {error || "Unable to load exam results"}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline" })}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <Link href={`/exam/${examId}`} className={buttonVariants()}>
              <FileText className="h-4 w-4 mr-2" />
              Take Exam
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const passingScore = result.exam?.passingScore ?? 60;
  const passed = result.percentage >= passingScore;
  const formattedDate = result.submittedAt
    ? format(new Date(result.submittedAt), "MMMM d, yyyy 'at' h:mm a")
    : "Not submitted";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header with Pass/Fail Status */}
      <Card
        className={`border-t-4 ${passed ? "border-t-green-500" : "border-t-red-500"}`}
      >
        <CardContent className="p-6 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {passed ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {result.exam?.title || "Exam Results"}
          </h1>
          <p className="text-muted-foreground mb-4">
            Completed on {formattedDate}
          </p>

          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {result.score ?? 0} / {result.totalPoints ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}
              >
                {result.percentage?.toFixed(1) ?? 0}%
              </p>
              <p className="text-sm text-muted-foreground">Percentage</p>
            </div>
          </div>

          <Progress
            value={result.percentage ?? 0}
            className="h-2 mb-4 max-w-md mx-auto"
          />

          <div className="flex gap-3 justify-center flex-wrap">
            <Badge
              variant={passed ? "default" : "secondary"}
              className="text-sm"
            >
              {passed ? "Passed" : "Failed"}
            </Badge>
            {result.exam?.passingScore && (
              <Badge variant="outline" className="text-sm">
                Passing Score: {result.exam.passingScore}%
              </Badge>
            )}
            {result.flagged && (
              <Badge variant="destructive" className="text-sm gap-1">
                <AlertTriangle className="h-3 w-3" />
                Flagged - {result.violationCount ?? 0} Violations
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Violation Warning (if any) */}
      {(result.violationCount ?? 0) > 0 && !result.flagged && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {result.violationCount} tab switching violation
              {result.violationCount !== 1 ? "s" : ""} detected during your
              exam.
              {result.violationCount >= 2 &&
                " Please avoid this in future exams."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {result.questions && result.questions.length > 0 ? (
            result.questions.map((question, index) => (
              <div key={question.id} className={`border rounded-lg p-4 `}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2">
                    {question.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Question {index + 1}</p>
                      <p className="text-muted-foreground mt-1">
                        {question.text}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {question.pointsEarned ?? 0} / {question.points ?? 0} pts
                  </Badge>
                </div>

                <div className="ml-7 space-y-2">
                  {question.options?.map((option, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const isCorrectAnswer = option === question.correctAnswer;
                    const isUserAnswer = option === question.userAnswer;

                    let bgColor = "";
                    if (isCorrectAnswer) {
                      bgColor = "border-green-300";
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      bgColor = "border-red-300";
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
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {!question.isCorrect && question.correctAnswer && (
                  <div className="ml-7 mt-3 text-sm text-green-700 bg-green-100 p-2 rounded">
                    <span className="font-medium">Correct answer: </span>
                    {question.correctAnswer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No questions found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline", className: "gap-2" })}
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
        {result.flagged ? (
          <Button variant="destructive" disabled className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Exam Flagged - Contact Administrator
          </Button>
        ) : (
          <Link
            href={`/exam/${examId}`}
            className={buttonVariants({ className: "gap-2" })}
          >
            <FileText className="h-4 w-4" />
            View Exam
          </Link>
        )}
      </div>
    </div>
  );
}
