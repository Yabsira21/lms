import { PublicLiveClassType } from "@/app/data/live-class/get-all-live-classes";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useContructUrl } from "@/hooks/use-construct-url";
import { Calendar, Clock, User, Users, DollarSign, School } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface iAppProps {
  data: PublicLiveClassType;
}

export function PublicLiveClassCard({ data }: iAppProps) {
  const thumbnailUrl = useContructUrl(data.thumbnailKey || "");

  return (
    <Card className="group relative py-0 gap-0">
      <Badge className="absolute top-2 right-2 z-10">
        {data.daysOfWeek.length}x/week
      </Badge>

      {data.thumbnailKey ? (
        <Image
          width={600}
          height={400}
          className="w-full rounded-t-xl aspect-video h-full object-cover"
          src={thumbnailUrl}
          alt={data.title}
        />
      ) : (
        <div className="w-full rounded-t-xl aspect-video bg-muted flex items-center justify-center">
          <School className="size-12 text-muted-foreground" />
        </div>
      )}

      <CardContent className="p-4">
        <Link
          href={`/live-classes/${data.slug}`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {data.smallDescription}
        </p>

        <div className="mt-4 space-y-2">
          {/* Instructor */}
          <div className="flex items-center gap-x-2">
            <User className="size-5 p-1 rounded-md text-primary bg-primary/10" />
            <span className="text-sm text-muted-foreground">
              {data.instructor.name}
            </span>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-x-2">
            <Calendar className="size-5 p-1 rounded-md text-primary bg-primary/10" />
            <span className="text-sm text-muted-foreground">
              Starts {format(new Date(data.startDate), "MMM d, yyyy")}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-x-2">
            <Clock className="size-5 p-1 rounded-md text-primary bg-primary/10" />
            <span className="text-sm text-muted-foreground">
              {data.startTime} • {data.sessionDuration} min
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-x-2">
            <Clock className="size-5 p-1 rounded-md text-primary bg-primary/10" />
            <span className="text-sm text-muted-foreground">
              {data.durationWeeks} weeks • {data._count.classes} sessions
            </span>
          </div>

          {/* Price & Capacity */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-x-2">
              <DollarSign className="size-5 p-1 rounded-md text-primary bg-primary/10" />
              <span className="text-lg font-bold">${data.price}</span>
            </div>
            <div className="flex items-center gap-x-2">
              <Users className="size-5 p-1 rounded-md text-primary bg-primary/10" />
              <span className="text-sm text-muted-foreground">
                Max {data.maxStudents || "∞"} students
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/live-classes/${data.slug}`}
          className={buttonVariants({ className: "w-full mt-4" })}
        >
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}

export function PublicLiveClassCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10">
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <Skeleton className="w-full rounded-t-xl aspect-video" />

      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />

        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-x-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-x-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="flex items-center gap-x-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        <Skeleton className="mt-4 w-full h-10 rounded-md" />
      </CardContent>
    </Card>
  );
}
