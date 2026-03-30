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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { AdminLiveClassSingularData } from "@/app/data/admin/admin-get-live-class";
import { StyleWrapper } from "./tableStyle";
import { updateClass, deleteClass } from "../actions";

interface iAppProps {
  data: AdminLiveClassSingularData;
}

export function ClassSchedule({ data }: iAppProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    startTime: "",
    endTime: "",
    status: "",
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const events = data.classes.map((c) => ({
    id: c.id,
    title: c.title,
    start: c.startTime,
    end: c.endTime ?? undefined,
    status: c.status,
  }));

  const handleEdit = (event: any) => {
    const start = new Date(event.start);
    const end = event.end
      ? new Date(event.end)
      : new Date(start.getTime() + 60 * 60000);

    setFormData({
      title: event.title,
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
      status: event.extendedProps.status || "Scheduled",
    });
    setStartDate(start);
    setEndDate(end);
    setEditMode(true);
  };

  const handleUpdate = async () => {
    if (!selectedEvent) return;

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    // Check if date is in the past
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast.error("Cannot schedule classes in the past");
      return;
    }

    // Check if status is Completed - prevent editing
    if (formData.status === "Completed") {
      toast.error("Cannot edit completed classes");
      return;
    }

    // Parse time strings and create proper Date objects
    const [startHours, startMinutes] = formData.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = formData.endTime.split(":").map(Number);

    const finalStartDate = new Date(startDate);
    finalStartDate.setHours(startHours, startMinutes, 0);

    const finalEndDate = new Date(startDate); // Use same date for end
    finalEndDate.setHours(endHours, endMinutes, 0);

    // If end time is earlier than start time (e.g., 10pm start, 2am end next day)
    if (finalEndDate <= finalStartDate) {
      // Add one day to end date if it's for the next day
      finalEndDate.setDate(finalEndDate.getDate() + 1);
    }

    console.log("Start:", finalStartDate);
    console.log("End:", finalEndDate);

    // Final validation
    if (finalEndDate <= finalStartDate) {
      toast.error("End time must be after start time");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateClass(selectedEvent.id, {
        title: formData.title,
        startTime: finalStartDate,
        endTime: finalEndDate,
        status: formData.status as any,
        liveClassId: data.id,
      });

      if (result.status === "success") {
        toast.success(result.message);
        setEditMode(false);
        setSelectedEvent(null);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update class");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    // Check if class is in the past or completed
    const eventStart = new Date(selectedEvent.start);
    const now = new Date();

    if (eventStart < now) {
      toast.error("Cannot delete past classes");
      return;
    }

    if (selectedEvent.extendedProps.status === "Completed") {
      toast.error("Cannot delete completed classes");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this class? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteClass(selectedEvent.id, data.id);

      if (result.status === "success") {
        toast.success(result.message);
        setSelectedEvent(null);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete class");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <StyleWrapper>
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => {
          setSelectedEvent(null);
          setEditMode(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="mb-4">
              {editMode ? "Edit Class" : selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {!editMode ? (
            // View Mode
            <>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      selectedEvent?.extendedProps?.status === "Scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : selectedEvent?.extendedProps?.status === "Ongoing"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedEvent?.extendedProps?.status || "Scheduled"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Start:</span>
                  <p className="text-muted-foreground mt-1">
                    {selectedEvent?.start?.toLocaleString()}
                  </p>
                </div>
                {/* <div>
                  <span className="font-medium">End:</span>
                  <p className="text-muted-foreground mt-1">
                    {selectedEvent?.end?.toLocaleString()}
                  </p>
                </div> */}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Class"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEdit(selectedEvent)}
                >
                  Edit Class
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Edit Mode
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Class title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed" disabled>
                        Completed (Cannot edit)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
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
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        eventClassNames={(arg) => {
          if (arg.event.extendedProps.status === "Completed") {
            return ["bg-gray-400"];
          }
          if (arg.event.extendedProps.status === "Ongoing") {
            return ["bg-green-500"];
          }
          return ["bg-blue-500"];
        }}
      />
    </StyleWrapper>
  );
}
