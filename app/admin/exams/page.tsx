import { adminGetExams } from "@/app/data/admin/admin-get-exams";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function AdminExamsPage() {
  const exams = await adminGetExams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage exams for your students
          </p>
        </div>
        <Link
          href="/admin/exams/create"
          className={buttonVariants({ className: "gap-2" })}
        >
          <Plus className="h-4 w-4" />
          Create Exam
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {exam.description || "No description"}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    exam.status === "Published"
                      ? "default"
                      : exam.status === "Draft"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {exam.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <span>{exam._count.questions} questions</span>
                <span>{exam._count.submissions} submissions</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/exams/${exam.id}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "flex-1 gap-1",
                  })}
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
                <Link
                  href={`/admin/exams/${exam.id}/edit`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "flex-1 gap-1",
                  })}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                {/* <button
                  className={buttonVariants({
                    variant: "destructive",
                    size: "sm",
                    className: "gap-1",
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </button> */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No exams created yet</p>
            <Link
              href="/admin/exams/create"
              className={buttonVariants({ variant: "link", className: "mt-2" })}
            >
              Create your first exam
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
