"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
// import { startExam } from "./actions";
import { toast } from "sonner";
import { startExam } from "./actions";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  passingScore: number | null;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    points: number;
  }>;
}

export default function ExamLandingPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      const res = await fetch(`/api/exam/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        setHasSubmitted(data.hasSubmitted);
      } else {
        toast.error("Exam not found");
        router.push("/dashboard");
      }
      setLoading(false);
    };
    fetchExam();
  }, [examId, router]);

  const handleStartExam = async () => {
    setStarting(true);
    await startExam(examId);
    // The action will redirect, so no need to handle here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) return null;

  if (hasSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>Already Submitted</CardTitle>
            <CardDescription>
              You have already completed this exam.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href={`/exam/${examId}/results`} className={buttonVariants()}>
              View Your Results
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          {exam.description && (
            <CardDescription className="text-base mt-2">
              {exam.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-xl font-semibold">{exam.questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-xl font-semibold">{totalPoints}</p>
            </div>
            {exam.duration && (
              <div>
                <p className="text-sm text-muted-foreground">Time Limit</p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {exam.duration} minutes
                </p>
              </div>
            )}
            {exam.passingScore && (
              <div>
                <p className="text-sm text-muted-foreground">Passing Score</p>
                <p className="text-xl font-semibold">{exam.passingScore}%</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Instructions:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Read each question carefully before answering.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Select the best answer for each question.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  You can navigate between questions using the Previous/Next
                  buttons.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Do not switch tabs or open other applications during the exam.
                </span>
              </li>
              {exam.duration && (
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    The exam will automatically submit when time runs out.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2 text-red-600 font-medium">
                <span>⚠</span>
                <span>
                  Tab switching or leaving the exam window will be recorded as a
                  violation (max 3).
                </span>
              </li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="pt-4">
            <Button
              onClick={handleStartExam}
              disabled={starting}
              className="w-full py-6 text-lg"
            >
              {starting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Starting Exam...
                </>
              ) : (
                "Start Exam"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              By starting this exam, you agree to follow all proctoring
              guidelines.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
