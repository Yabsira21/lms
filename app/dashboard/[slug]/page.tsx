import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { redirect } from "next/navigation";

interface iAppProps {
  params: Promise<{ slug: string }>;
  // children: ReactNode;
}

export default async function CourseSlugRoute({ params }: iAppProps) {
  const { slug } = await params;
  const course = await getCourseSidebarData(slug);

  const firstChapter = course.course.chapters[0];
  const firstLesson = firstChapter.lessons[0];

  if (firstLesson) {
    redirect(`/dashboard/${slug}/${firstLesson.id}`);
  }

  return (
    <div className="flex items-center justify-center h-full text-center">
      <h2 className="text-2xl font-bold mb-2">No lessos available</h2>
      <p className="text-muted-foreground">
        This course doesn't have any course yet
      </p>
    </div>
  );
}
