"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Result {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  flagged: boolean;
  violationCount: number;
  answers: Record<string, { answer: string; correct: boolean; points: number }>;
  submittedAt: string;
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [result, setResult] = useState<Result | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch(`/api/exam/${examId}/results`);
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        setExamTitle(data.examTitle);
      } else {
        router.push("/dashboard");
      }
      setLoading(false);
    };
    fetchResults();
  }, [examId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const passed = result.percentage >= 60;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                passed ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {passed ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{examTitle}</h1>
            <p className="text-gray-600 mb-4">
              Completed on {new Date(result.submittedAt).toLocaleString()}
            </p>

            <div className="text-4xl font-bold mb-2">
              {result.score} / {result.totalPoints}
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {result.percentage.toFixed(1)}% - {passed ? "Passed" : "Failed"}
            </div>

            {result.flagged && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>
                  Exam Flagged - {result.violationCount} violations detected
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold mb-4">Question Review</h2>
        <div className="space-y-4">
          {Object.entries(result.answers).map(([questionId, data], index) => (
            <Card key={questionId}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {data.correct ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-2">Question {index + 1}</p>
                    <p className="text-gray-700 mb-2">
                      {data.answer || "No answer provided"}
                    </p>
                    {!data.correct && (
                      <p className="text-sm text-gray-500">
                        Points earned: {data.points}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
