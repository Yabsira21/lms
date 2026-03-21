// import { getLiveClassSessionData } from "@/app/data/live-class/get-live-class-session-data";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoIcon, ClockIcon, CalendarIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { getLiveClassSessionData } from "@/app/data/live-class/get-live-class-session-data";

interface iAppProps {
  params: Promise<{ slug: string; classId: string }>;
}

export default async function LiveClassSessionPage({ params }: iAppProps) {
  const { slug, classId } = await params;
  const { session, liveClass } = await getLiveClassSessionData(slug, classId);

  const now = new Date();
  const sessionTime = new Date(session.startTime);
  const canJoin = sessionTime.getTime() - now.getTime() < 15 * 60 * 1000; // 15 minutes before start

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <p className="text-muted-foreground mt-1">{liveClass.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="size-5 text-muted-foreground" />
                <span>{format(sessionTime, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ClockIcon className="size-5 text-muted-foreground" />
                <span>
                  {format(sessionTime, "h:mm a")} -{" "}
                  {format(new Date(session.endTime!), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UsersIcon className="size-5 text-muted-foreground" />
                <span>Live session with {liveClass.instructor.name}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About This Session</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is a live interactive session. Please join on time to get
                the full experience. Recordings will be available after the
                session.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Join Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.status === "Ongoing" ||
              (canJoin && session.status === "Scheduled") ? (
                <Button className="w-full" size="lg" asChild>
                  <Link
                    href={
                      session.meetingId
                        ? `https://meet.livekit.io/${session.meetingId}`
                        : "#"
                    }
                    target="_blank"
                  >
                    <VideoIcon className="size-4 mr-2" />
                    Join Live Session
                  </Link>
                </Button>
              ) : session.status === "Completed" ? (
                <Button className="w-full" disabled variant="outline">
                  Session Ended
                </Button>
              ) : (
                <Button className="w-full" disabled variant="outline">
                  <ClockIcon className="size-4 mr-2" />
                  Join {format(sessionTime, "h:mm a")}
                </Button>
              )}

              <div className="text-xs text-center text-muted-foreground space-y-1">
                <p>Session starts at {format(sessionTime, "h:mm a")}</p>
                <p>You can join 15 minutes before start</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
