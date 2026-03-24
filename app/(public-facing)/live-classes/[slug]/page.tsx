import { getIndividualLiveClass } from "@/app/data/live-class/get-live-class";
// import { checkIfLiveClassEnrolled } from "@/app/data/user/user-is-enrolled-live";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useContructUrl } from "@/hooks/use-construct-url";
import {
  IconCalendar,
  IconClock,
  IconUser,
  IconUsers,
  IconCategory,
  IconCalendarWeek,
  IconChevronDown,
  IconMapPin,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { EnrollmentButton } from "./_components/EnrollmentButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { checkIfLiveClassEnrolled } from "@/app/data/user/user-is-enrolled-live";

type Params = Promise<{ slug: string }>;

export default async function LiveClassSlugPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const liveClass = await getIndividualLiveClass(slug);
  const thumbnailUrl = useContructUrl(liveClass.thumbnailKey || "");
  const isEnrolled = await checkIfLiveClassEnrolled(liveClass.id);

  // Check if the current user is the instructor
  const { headers } = await import("next/headers");
  const { auth } = await import("@/lib/auth");
  const authSession = await auth.api.getSession({ headers: await headers() });
  const isInstructor = authSession?.user?.id === liveClass.instructor.id;

  // Calculate total sessions and weeks info
  const totalSessions = liveClass._count.classes;
  const sessionsPerWeek = liveClass.daysOfWeek.length;
  const totalWeeks = liveClass.durationWeeks;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-5">
      <div className="order-1 lg:col-span-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
          {liveClass.thumbnailKey ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <IconCalendar className="size-20 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              {liveClass.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
              {liveClass.smallDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconCategory className="size-4" />
              <span>{liveClass.category}</span>
            </Badge>

            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconCalendar className="size-4" />
              <span>
                Starts {format(new Date(liveClass.startDate), "MMM d, yyyy")}
              </span>
            </Badge>

            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconClock className="size-4" />
              <span>{liveClass.sessionDuration} min</span>
            </Badge>

            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconCalendarWeek className="size-4" />
              <span>
                {sessionsPerWeek}x/week • {totalWeeks} weeks
              </span>
            </Badge>
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              About This Live Class
            </h2>

            <RenderDescription json={JSON.parse(liveClass.description)} />
          </div>
        </div>
      </div>

      <div className="order-2 lg:col-span-1">
        <div className="sticky top-20">
          <Card className="py-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-medium">Price:</span>
                <span className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(liveClass.price)}
                </span>
              </div>

              <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
                <h4 className="font-medium">Class Details:</h4>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconUser className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Instructor</p>
                      <p className="text-sm text-muted-foreground">
                        {liveClass.instructor.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconCalendar className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(liveClass.startDate), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconClock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Schedule</p>
                      <p className="text-sm text-muted-foreground">
                        {liveClass.daysOfWeek.join(", ")} at{" "}
                        {liveClass.startTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconCalendarWeek className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {liveClass.durationWeeks} weeks • {totalSessions}{" "}
                        sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconUsers className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Class Size</p>
                      <p className="text-sm text-muted-foreground">
                        Max {liveClass.maxStudents || "Unlimited"} students
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <h4 className="font-medium">This class includes:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>{totalSessions} live sessions</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Session recordings available</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Live Q&A with instructor</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Access on mobile and desktop</span>
                  </li>
                </ul>
              </div>

              {isInstructor ? (
                <Link
                  className={buttonVariants({ className: "w-full" })}
                  href={`/dashboard/liveclass/${liveClass.slug}`}
                >
                  Go to Classroom
                </Link>
              ) : isEnrolled ? (
                <Link
                  className={buttonVariants({ className: "w-full" })}
                  href={`/dashboard/liveclass/${liveClass.slug}`}
                >
                  Go to Classroom
                </Link>
              ) : (
                <EnrollmentButton liveClassId={liveClass.id} />
              )}

              <p className="text-xs text-center text-muted-foreground mt-3">
                30-day money-back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
