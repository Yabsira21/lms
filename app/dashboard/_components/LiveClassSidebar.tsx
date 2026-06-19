"use client";

import { useState } from "react";
import { LiveClassSideDataType } from "@/app/data/live-class/get-live-class-sidebar-data";
import { cn } from "@/lib/utils";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  ChevronRight,
  MessageCircle,
  InfoIcon,
  FolderOpenIcon,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

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

  // Get all sessions for the selected date
  const sessionsOnSelectedDate = selectedDate
    ? liveClass.classes.filter((session) =>
        isSameDay(new Date(session.startTime), selectedDate),
      )
    : [];

  // Get sessions for calendar highlighting (any date that has sessions)
  const datesWithSessions = liveClass.classes.map(
    (session) => new Date(session.startTime),
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b">
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

      {/* Navigation Tabs - Fixed */}
      <div className="flex-shrink-0 border-b overflow-x-auto">
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

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Calendar Section */}
        <div className="border-b p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Schedule Calendar</h3>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasSession: datesWithSessions,
            }}
            modifiersClassNames={{
              hasSession: "bg-primary/10 font-semibold text-primary",
            }}
            disabled={(date) => isBefore(date, startOfDay(new Date()))}
          />
        </div>

        {/* Sessions for Selected Date */}
        <div className="py-4">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Select a date"}
            </h3>
          </div>

          <div className="space-y-1">
            {sessionsOnSelectedDate.length > 0 ? (
              sessionsOnSelectedDate.map((session) => {
                const isActive = pathname.includes(session.id);
                const sessionDate = new Date(session.startTime);
                const now = new Date();
                const isSoon =
                  sessionDate.getTime() - now.getTime() < 30 * 60 * 1000;
                const canJoin =
                  session.status === "Ongoing" ||
                  (session.status === "Scheduled" && sessionDate <= now);

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
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {format(sessionDate, "h:mm a")}
                        </p>
                        {session.status === "Ongoing" && (
                          <span className="text-xs bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full">
                            Live
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canJoin && session.status !== "Completed" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Join Now
                        </span>
                      )}
                      {isSoon && session.status === "Scheduled" && !canJoin && (
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
              <div className="px-3 py-6 text-center">
                <CalendarDays className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No sessions scheduled for this date
                </p>
                {selectedDate &&
                  isBefore(selectedDate, startOfDay(new Date())) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This date has passed
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Upcoming Sessions Section */}
          <div className="mt-4 pt-2 border-t mx-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Upcoming Sessions
            </h3>
            <div className="space-y-1">
              {liveClass.classes.slice(0, 3).map((session) => {
                const sessionDate = new Date(session.startTime);
                const isSelected =
                  selectedDate && isSameDay(sessionDate, selectedDate);

                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedDate(sessionDate)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors text-sm",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/50 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{session.title}</span>
                      <span className="text-xs">
                        {format(sessionDate, "MMM d")}
                      </span>
                    </div>
                  </button>
                );
              })}
              {liveClass.classes.length > 3 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{liveClass.classes.length - 3} more sessions
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t text-xs text-muted-foreground">
        <p>Total sessions: {liveClass._count.classes}</p>
      </div>
    </div>
  );
}
