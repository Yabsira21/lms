"use client";

import { InstructorLiveClassType } from "@/app/data/live-class/get-instructor-live-classes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContructUrl } from "@/hooks/use-construct-url";
import {
  Calendar,
  Clock,
  Users,
  CalendarDays,
  ChevronRight,
  Edit,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface iAppProps {
  data: InstructorLiveClassType;
}

export function InstructorLiveClassCard({ data }: iAppProps) {
  const thumbnailUrl = useContructUrl(data.thumbnailKey || "");
  const nextClass = data.classes[0];
  const enrolledCount = data._count.enrollments;
  const totalSessions = data._count.classes;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-500";
      case "Draft":
        return "bg-gray-500";
      case "Archieved":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="md:w-48 h-48 md:h-auto relative bg-muted">
            {data.thumbnailKey ? (
              <Image
                src={thumbnailUrl}
                alt={data.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar className="size-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(data.status)}>
                    {data.status}
                  </Badge>
                  {/* {nextClass && nextClass.status === "Ongoing" && (
                    <Badge variant="destructive" className="animate-pulse">
                      Live Now
                    </Badge>
                  )} */}
                </div>

                <Link
                  href={`/instructor/live-class/${data.id}`}
                  className="text-xl font-semibold hover:text-primary transition-colors line-clamp-1"
                >
                  {data.title}
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {data.smallDescription}
                </p>

                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span>
                      {enrolledCount} / {data.maxStudents || "∞"} enrolled
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span>{data.daysOfWeek.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>
                      {data.startTime} • {data.sessionDuration} min
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Next Session
                    </p>
                    {nextClass ? (
                      <p className="text-sm font-medium">
                        {nextClass.title} •{" "}
                        {format(new Date(nextClass.startTime), "MMM d, h:mm a")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No upcoming sessions
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Total sessions: {totalSessions}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <Link href={`/instructor/live-class/${data.id}/edit`}>
                        <Edit className="size-4" />
                        Edit
                      </Link>
                    </Button> */}
                    <Button size="sm" asChild className="gap-2">
                      <Link href={`/dashboard/liveclass/${data.slug}`}>
                        <Video className="size-4" />
                        Go
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstructorLiveClassCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-48 h-48 bg-muted animate-pulse" />
          <div className="flex-1 p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="space-y-1">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                <div className="h-9 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
