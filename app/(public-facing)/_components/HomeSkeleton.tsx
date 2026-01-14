"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <Skeleton className="h-6 w-48 rounded-full" />

          {/* Title */}
          <Skeleton className="h-10 md:h-14 w-[280px] md:w-[520px]" />

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[320px] md:w-[640px]" />
            <Skeleton className="h-4 w-[280px] md:w-[560px]" />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Skeleton className="h-12 w-40 rounded-md" />
            <Skeleton className="h-12 w-32 rounded-md" />
          </div>
        </div>
      </section>

      {/* Features Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-4">
              {/* Icon */}
              <Skeleton className="h-10 w-10 rounded-full" />

              {/* Title */}
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>

            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
