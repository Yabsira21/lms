import { getAllLiveClasses } from "@/app/data/live-class/get-all-live-classes";
import {
  PublicLiveClassCard,
  PublicLiveClassCardSkeleton,
} from "./_components/PublicLiveClassCard";
import { Suspense } from "react";

export default function PublicLiveClassesRoute() {
  return (
    <div className="mt-5">
      <div className="flex flex-col space-y-2 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
          Live Classes
        </h1>
        <p className="text-muted-foreground">
          Join interactive live sessions with expert instructors. Learn in
          real-time and get your questions answered immediately.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeletonLayout />}>
        <RenderLiveClasses />
      </Suspense>
    </div>
  );
}

async function RenderLiveClasses() {
  const liveClasses = await getAllLiveClasses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {liveClasses.map((liveClass) => (
        <PublicLiveClassCard key={liveClass.id} data={liveClass} />
      ))}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, index) => (
        <PublicLiveClassCardSkeleton key={index} />
      ))}
    </div>
  );
}
