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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-80 border-r border-border shrink-0">
            <LiveClassSidebar
              liveClass={liveClass}
              liveClassId={liveClass.id}
              isInstructor={isInstructor}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}
