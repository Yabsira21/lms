"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styled from "@emotion/styled";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

import { AdminLiveClassSingularData } from "@/app/data/admin/admin-get-live-class";
import { StyleWrapper } from "./tableStyle";

interface iAppProps {
  data: AdminLiveClassSingularData;
}

export function ClassSchedule({ data }: iAppProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const events = data.classes.map((c) => ({
    id: c.id,
    title: c.title,
    start: c.startTime,
    end: c.endTime ?? undefined,
  }));

  return (
    // <div className="bg-white rounded-xl p-4">
    <StyleWrapper>
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <p>Start: {selectedEvent?.start?.toLocaleString()}</p>

            <p>End: {selectedEvent?.end?.toLocaleString()}</p>
          </div>
        </DialogContent>
      </Dialog>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          setSelectedEvent(info.event);
        }}
        height="auto"
      />
    </StyleWrapper>
    // </div>
  );
}
