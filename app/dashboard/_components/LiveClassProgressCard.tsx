import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useContructUrl } from "@/hooks/use-construct-url";
import {
  Calendar,
  Clock,
  User,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { EnrolledLiveClassType } from "@/app/data/user/get-enrolled-liveclasses";

interface iAppProps {
  data: EnrolledLiveClassType;
}

export function LiveClassProgressCard({ data }: iAppProps) {
  const thumbnailUrl = useContructUrl(data.liveClass.thumbnailKey || "");
  const nextClass = data.liveClass.classes[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="relative md:w-52 h-40 md:h-auto shrink-0">
            {data.liveClass.thumbnailKey ? (
              <Image
                src={thumbnailUrl}
                alt={data.liveClass.title}
                fill
                className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                <Calendar className="size-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col justify-between p-6">
            {/* Top */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Link
                  href={`/dashboard/liveclass/${data.liveClass.slug}`}
                  className="text-lg font-semibold hover:text-primary transition line-clamp-1"
                >
                  {data.liveClass.title}
                </Link>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {data.liveClass.smallDescription}
                </p>
              </div>

              <Badge variant="outline" className="whitespace-nowrap">
                {data.liveClass._count.classes} sessions
              </Badge>
            </div>

            {/* Middle metadata */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <User className="size-4" />
                {data.liveClass.instructor.name}
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                {data.liveClass.daysOfWeek.join(", ")}
              </div>

              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                {data.liveClass.startTime} • {data.liveClass.sessionDuration}{" "}
                min
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between border-t mt-5 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Next Session</p>

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
              </div>

              <Link
                href={`/dashboard/liveclass/${data.liveClass.slug}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
              >
                Continue
                <ChevronRight className="size-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
