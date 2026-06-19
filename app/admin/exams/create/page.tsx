"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createExam } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      order: 0,
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error("You need at least one question");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter an exam title");
      return;
    }

    const validQuestions = questions.filter((q) => q.text.trim());
    if (validQuestions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate each question
    for (const q of validQuestions) {
      if (!q.text.trim()) {
        toast.error("Please fill in all question texts");
        return;
      }
      const validOptions = q.options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        toast.error(`Question "${q.text}" needs at least 2 options`);
        return;
      }
      if (!q.correctAnswer) {
        toast.error(`Please select a correct answer for question "${q.text}"`);
        return;
      }
    }

    setLoading(true);
    const result = await createExam({
      title,
      description: description || undefined,
      duration: duration ? parseInt(duration) : undefined,
      passingScore: passingScore ? parseInt(passingScore) : undefined,
      status,
      questions: validQuestions.map((q, idx) => ({
        text: q.text,
        options: q.options.filter((opt) => opt.trim()),
        correctAnswer: q.correctAnswer,
        points: q.points,
        order: idx,
      })),
    });

    if (result.status === "success") {
      toast.success(result.message);
      router.push("/admin/exams");
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Exam</h1>
          <p className="text-muted-foreground mt-1">
            Create a new exam with multiple questions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              "Create Exam"
            )}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Exam Title</Label>
            <Input
              id="title"
              placeholder="e.g., Final Exam - Mathematics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this exam covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for no time limit
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                placeholder="70"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            {/* <Label htmlFor="status">Status</Label>

            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "Draft" | "Published")
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm 
               focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
             */}
            <Select
              onValueChange={(v) => setStatus(v as "Draft" | "Published")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button onClick={addQuestion} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                Question {index + 1}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(question.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Question Text</Label>
                <Textarea
                  placeholder="Enter your question here..."
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(question.id, "text", e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8">
                        {String.fromCharCode(65 + optIndex)}
                      </Badge>
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                        value={option}
                        onChange={(e) =>
                          updateOption(question.id, optIndex, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(question.id, "correctAnswer", option)
                        }
                        className={`px-3 py-2 rounded-md text-sm ${
                          question.correctAnswer === option
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        Correct
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={question.points}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "points",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
