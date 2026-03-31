import { ReactNode } from "react";
import { LiveClassSidebar } from "../../_components/LiveClassSidebar";
import { getLiveClassSidebarData } from "@/app/data/live-class/get-live-class-sidebar-data";

interface iAppProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function LiveClassLayout({ children, params }: iAppProps) {
  const { slug } = await params;
  const { liveClass, isInstructor } = await getLiveClassSidebarData(slug);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT CONTENT */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* RIGHT SIDEBAR */}
      <div className="w-80 border-l border-border h-full overflow-y-auto">
        <LiveClassSidebar
          liveClass={liveClass}
          liveClassId={liveClass.id}
          isInstructor={isInstructor}
        />
      </div>
    </div>
  );
}
