"use client";

import { LiveClassSideDataType } from "@/app/data/live-class/get-live-class-sidebar-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  ChevronRight,
  MessageCircle,
  InfoIcon,
  FolderOpenIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LiveClassSidebarProps {
  liveClass: LiveClassSideDataType["liveClass"];
  liveClassId: string;
  isInstructor?: boolean;
}

export function LiveClassSidebar({
  liveClass,
  liveClassId,
  isInstructor = false,
}: LiveClassSidebarProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Info",
      href: `/dashboard/liveclass/${liveClass.slug}`,
      icon: InfoIcon,
      exact: true,
    },
    {
      name: "Chat",
      href: `/dashboard/liveclass/${liveClass.slug}/chat`,
      icon: MessageCircle,
      exact: false,
    },
    {
      name: "Resources",
      href: `/dashboard/liveclass/${liveClass.slug}/resources`,
      icon: FolderOpenIcon,
      exact: false,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg line-clamp-2">
          {liveClass.title}
        </h2>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="size-4" />
            <span>{liveClass.instructor.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="size-4" />
            <span>{liveClass.daysOfWeek.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockIcon className="size-4" />
            <span>
              {liveClass.startTime} • {liveClass.sessionDuration} min
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="size-4" />
            <span>
              {liveClass._count.enrollments} / {liveClass.maxStudents || "∞"}{" "}
              students
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Horizontal Scroll for mobile, flex wrap on desktop */}
      <div className="border-b overflow-x-auto">
        <div className="flex min-w-max md:min-w-0">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.includes(tab.href) &&
                tab.href !== `/dashboard/liveclass/${liveClass.slug}`;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <tab.icon className="size-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Upcoming Sessions
          </h3>
        </div>

        <div className="space-y-1">
          {liveClass.classes.length > 0 ? (
            liveClass.classes.map((session) => {
              const isActive = pathname.includes(session.id);
              const sessionDate = new Date(session.startTime);
              const now = new Date();
              const isSoon =
                sessionDate.getTime() - now.getTime() < 30 * 60 * 1000;

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/liveclass/${liveClass.slug}/${session.id}`}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 mx-2 rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(sessionDate, "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSoon && session.status === "Scheduled" && (
                      <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No upcoming sessions
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>Total sessions: {liveClass._count.classes}</p>
      </div>
    </div>
  );
}
