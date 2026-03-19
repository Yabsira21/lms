"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { AdminLiveClassSingularData } from "@/app/data/admin/admin-get-live-class";

interface iAppProps {
  data: AdminLiveClassSingularData;
}

export function ClassSchedule({ data }: iAppProps) {
  const events = data.classes.map((c) => ({
    id: c.id,
    title: c.title,
    start: c.startTime,
    end: c.endTime,
  }));

  return (
    <div className="bg-white rounded-xl p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
      />
    </div>
  );
}
