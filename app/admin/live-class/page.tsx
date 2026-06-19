import { adminGetLiveClasses } from "@/app/data/admin/admin-get-live-classes";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  AdminLiveClassCard,
  AdminLiveClassCardSkeleton,
} from "./_components/AdminLiveClassCard";
import { EmptyState } from "@/components/general/EmptyState";
import { Suspense } from "react";

export default function LiveClassesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Classes</h1>

        <Link className={buttonVariants()} href="/admin/live-class/create">
          Create Live Class
        </Link>
      </div>

      <Suspense fallback={<AdminLiveClassCardSkeletonLayout />}>
        <RenderLiveClasses />
      </Suspense>
    </>
  );
}

async function RenderLiveClasses() {
  const data = await adminGetLiveClasses();

  return (
    <>
      {data.length === 0 ? (
        <EmptyState
          title="No live classes found"
          description="Create a new live class to get started"
          buttonText="Create Live Class"
          href="/admin/live-class/create"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
          {data.map((liveClass) => (
            <AdminLiveClassCard data={liveClass} key={liveClass.id} />
          ))}
        </div>
      )}
    </>
  );
}

function AdminLiveClassCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
      {Array.from({ length: 4 }).map((_, index) => (
        <AdminLiveClassCardSkeleton key={index} />
      ))}
    </div>
  );
}
