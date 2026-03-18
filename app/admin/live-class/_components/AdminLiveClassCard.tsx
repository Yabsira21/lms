import { AdminLiveClassType } from "@/app/data/admin/admin-get-live-classes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useContructUrl } from "@/hooks/use-construct-url";
import {
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface iAppProps {
  data: AdminLiveClassType;
}

export function AdminLiveClassCard({ data }: { data: AdminLiveClassType }) {
  const thumbNailUrl = useContructUrl(data.thumbnailKey || "");

  return (
    <Card className="group relative py-0 gap-0">
      {/* Dropdown Menu */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/live-class/${data.id}/edit`}
                className="w-full"
              >
                <Pencil className="size-4 mr-2" />
                Edit Class
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/live-class/${data.slug}`} className="w-full">
                <Eye className="size-4 mr-2" />
                Preview Class
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/live-class/${data.id}/delete`}
                className="w-full"
              >
                <Trash2 className="size-4 mr-2 text-destructive" />
                Delete Class
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Thumbnail */}
      {data.thumbnailKey ? (
        <Image
          src={thumbNailUrl}
          alt={data.title}
          width={600}
          height={400}
          className="w-full rounded-t-lg aspect-video h-full object-cover"
        />
      ) : (
        <div className="w-full rounded-t-lg aspect-video bg-muted flex items-center justify-center">
          <School className="size-12 text-muted-foreground" />
        </div>
      )}

      <CardContent className="p-4">
        {/* Title */}
        <Link
          href={`/admin/live-class/${data.id}/edit`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>

        {/* Instructor name */}
        <p className="text-sm text-muted-foreground mt-1">
          by {data.instructor.name}
        </p>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {data.smallDescription}
        </p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-x-2">
            <Calendar className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Starts</span>
              <span className="text-sm font-medium">
                {format(new Date(data.startDate), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            <Clock className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Duration</span>
              <span className="text-sm font-medium">
                {data.durationWeeks} weeks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            <School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Schedule</span>
              <span className="text-sm font-medium">
                {data.daysOfWeek.length}d/w at {data.startTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            <Users className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Students</span>
              <span className="text-sm font-medium">
                {data._count.enrollments}/{data.maxStudents || "∞"}
              </span>
            </div>
          </div>
        </div>

        {/* Price and Sessions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <span className="text-lg font-bold">${data.price}</span>
            <span className="text-xs text-muted-foreground">
              • {data._count.classes} sessions
            </span>
          </div>
          <Badge className={`${getStatusColor(data.status)} text-white`}>
            {data.status}
          </Badge>
        </div>

        {/* Edit Button */}
        <Link
          href={`/admin/live-class/${data.id}/edit`}
          className={buttonVariants({
            className: "w-full mt-4",
          })}
        >
          Edit Class <ArrowRight className="size-4 ml-2" />
        </Link>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
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
}

export function AdminLiveClassCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10">
        <Skeleton className="size-8 rounded-md" />
      </div>

      <Skeleton className="w-full rounded-t-lg aspect-video" />

      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 mb-4 rounded" />

        <div className="mt-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-x-2">
              <Skeleton className="size-6 rounded-md" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <Skeleton className="mt-4 h-10 w-full rounded" />
      </CardContent>
    </Card>
  );
}
