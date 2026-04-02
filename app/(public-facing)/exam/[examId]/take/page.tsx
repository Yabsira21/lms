"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
// import { submitExam, recordViolation } from "../actions";
import { toast } from "sonner";
import { recordViolation, submitExam } from "../actions";

interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
}

interface Exam {
  id: string;
  title: string;
  duration: number | null;
  questions: Question[];
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      const res = await fetch(`/api/exam/${examId}/take`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        if (data.exam.duration) {
          setTimeLeft(data.exam.duration * 60);
        }
        if (data.violationCount !== undefined) {
          setViolationCount(data.violationCount);
        }
        if (data.answers) {
          setAnswers(data.answers);
        }
      } else {
        toast.error("Failed to load exam");
        router.push(`/exam/${examId}`);
      }
      setLoading(false);
    };
    fetchExam();
  }, [examId, router]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAutoSubmit = async () => {
    if (submitting) return;
    toast.warning("Time's up! Submitting your exam...");
    await handleSubmit();
  };

  // Proctoring: Detect tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation(examId);
        setViolationCount((prev) => {
          const newCount = prev + 1;
          if (newCount === 1) {
            setWarning(
              "⚠️ Warning: Tab switching detected. Please stay on the exam page.",
            );
          } else if (newCount === 2) {
            setWarning(
              "⚠️ Final warning: Another violation will flag your exam.",
            );
          } else {
            setWarning(
              "🚨 Your exam has been flagged due to multiple violations.",
            );
          }
          setTimeout(() => setWarning(null), 5000);
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examId]);

  // Prevent copy-paste and right-click
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Copying is not allowed during exam");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Pasting is not allowed during exam");
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "v" || e.key === "x")
      ) {
        e.preventDefault();
        toast.error("Copy/Paste is not allowed during exam");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const result = await submitExam(examId, answers, violationCount);
    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
    // On success, the action redirects to results page
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) return null;

  const currentQuestion = exam.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-semibold">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {exam.questions.length}
            </p>
          </div>
          <div className="text-right">
            {timeLeft !== null && (
              <>
                <div
                  className={`text-xl font-bold flex items-center gap-1 ${timeLeft < 60 ? "text-red-500" : ""}`}
                >
                  <Clock className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-muted-foreground">Time Remaining</p>
              </>
            )}
          </div>
        </div>
        <Progress value={progress} className="rounded-none h-1" />
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="border-b border-yellow-200 p-3 animate-in slide-in-from-top">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{warning}</span>
          </div>
        </div>
      )}

      {/* Violation Indicator */}
      {violationCount > 0 && (
        <div className="border-b border-red-200 p-2">
          <div className="max-w-4xl mx-auto text-center">
            <span
              className={`text-sm ${violationCount >= 3 ? "text-red-600 font-bold" : "text-red-500"}`}
            >
              ⚠️ Violations: {violationCount}/3
            </span>
          </div>
        </div>
      )}

      {/* Question Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <Badge variant="outline" className="text-sm">
                  {currentQuestion.points} point
                  {currentQuestion.points !== 1 ? "s" : ""}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {answeredCount} of {exam.questions.length} answered
                </span>
              </div>
              <h2 className="text-xl font-semibold">{currentQuestion.text}</h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = answers[currentQuestion.id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 "
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isSelected ? " text-white" : " text-gray-700"
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="flex-1">{option}</span>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
                variant="outline"
              >
                Previous
              </Button>
              {currentIndex === exam.questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  //   className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Exam"
                  )}
                </Button>
              ) : (
                <Button onClick={() => setCurrentIndex((prev) => prev + 1)}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
