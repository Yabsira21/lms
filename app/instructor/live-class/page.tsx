import { getInstructorLiveClasses } from "@/app/data/live-class/get-instructor-live-classes";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/general/EmptyState";
import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import {
  InstructorLiveClassCard,
  InstructorLiveClassCardSkeleton,
} from "../_components/InstructorLiveClassCard";
// import {
//   InstructorLiveClassCard,
//   InstructorLiveClassCardSkeleton,
// } from "./_components/InstructorLiveClassCard";

export default function InstructorLiveClassesPage() {
  return (
    <div className="@container/main flex flex-1 flex-col items-center px-4 lg:px-8">
      <div className="w-full max-w-6xl flex flex-col gap-4 py-6 md:gap-8 md:py-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">My Live Classes</h1>
            <p className="text-muted-foreground">
              Manage and monitor your live classes
            </p>
          </div>
          {/* <Link
            href="/instructor/live-class/create"
            className={buttonVariants({ className: "gap-2" })}
          >
            <PlusIcon className="size-4" />
            Create Live Class
          </Link> */}
        </div>

        <Suspense fallback={<InstructorLiveClassCardSkeletonLayout />}>
          <RenderInstructorLiveClasses />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderInstructorLiveClasses() {
  const liveClasses = await getInstructorLiveClasses();

  if (liveClasses.length === 0) {
    return (
      <EmptyState
        title="No live classes yet"
        description="You are not assigned to any live classes."
        buttonText="Go to Dashboard"
        href="/dashboard"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {liveClasses.map((liveClass) => (
        <InstructorLiveClassCard key={liveClass.id} data={liveClass} />
      ))}
    </div>
  );
}

function InstructorLiveClassCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <InstructorLiveClassCardSkeleton key={index} />
      ))}
    </div>
  );
}
