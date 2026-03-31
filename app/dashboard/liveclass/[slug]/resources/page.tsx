import { getLiveClassSidebarData } from "@/app/data/live-class/get-live-class-sidebar-data";
import { ResourcesList } from "../_components/ResourceList";
// import { ResourcesList } from "../_components/ResourcesList";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export default async function LiveClassResourcesPage({ params }: iAppProps) {
  const { slug } = await params;
  const { liveClass, isInstructor } = await getLiveClassSidebarData(slug);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Class Resources</h1>
        <p className="text-muted-foreground mt-1">
          {isInstructor
            ? "Share files and materials with your students"
            : "Download shared materials from your instructor"}
        </p>
      </div>

      <div className="flex-1">
        <ResourcesList liveClassId={liveClass.id} isInstructor={isInstructor} />
      </div>
    </div>
  );
}
