"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { submitExam, recordViolation } from "../actions";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      const res = await fetch(`/api/exam/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        if (data.exam.duration) {
          setTimeLeft(data.exam.duration * 60);
        }
      } else {
        toast.error("Failed to load exam");
        router.push("/dashboard");
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

  const handleAutoSubmit = () => {
    toast.warning("Time's up! Submitting your exam...");
    handleSubmit();
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

  // Prevent copy-paste
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

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) return null;

  const currentQuestion = exam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              {answeredCount} of {exam.questions.length} answered
            </p>
          </div>
          {timeLeft !== null && (
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${timeLeft < 60 ? "text-red-500" : ""}`}
              >
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-muted-foreground">Time Remaining</p>
            </div>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 animate-slide-in">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{warning}</span>
          </div>
        </div>
      )}

      {/* Violation Indicator */}
      {violationCount > 0 && (
        <div className="bg-red-50 border-b border-red-200 p-2">
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-sm font-medium">
                {currentQuestion.points} point(s)
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
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {letter}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 text-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Exam"
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
