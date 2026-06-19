import { getLiveClassSidebarData } from "@/app/data/live-class/get-live-class-sidebar-data";
import { redirect } from "next/navigation";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export default async function LiveClassSlugRoute({ params }: iAppProps) {
  const { slug } = await params;
  const { liveClass } = await getLiveClassSidebarData(slug);

  // Redirect to the first upcoming class
  const firstClass = liveClass.classes[0];

  if (firstClass) {
    redirect(`/dashboard/liveclass/${slug}/${firstClass.id}`);
  }

  return (
    <div className="flex items-center justify-center h-full text-center flex-col">
      <h2 className="text-2xl font-bold mb-2">No upcoming sessions</h2>
      <p className="text-muted-foreground">
        This live class doesn't have any upcoming sessions scheduled yet.
        <br />
        Check back later for the schedule.
      </p>
    </div>
  );
}
