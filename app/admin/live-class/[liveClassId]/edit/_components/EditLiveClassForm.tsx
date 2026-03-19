"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, Loader2, SparkleIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import slugify from "slugify";
import {
  liveClassSchema,
  LiveClassSchemaType,
  courseCategories,
  courseStatus,
  weekDays,
} from "@/lib/zodSchema";
// import { editLiveClass } from "../actions";
import { AdminLiveClassSingularData } from "@/app/data/admin/admin-get-live-class";
import { InstructorSelector } from "@/app/admin/live-class/_components/InstructorSelector";
import { editLiveClass } from "../actions";

interface iAppProps {
  data: AdminLiveClassSingularData;
}

export function EditLiveClassForm({ data }: iAppProps) {
  const [isPending, startTransition] = useTransition();
  const [openDays, setOpenDays] = useState(false);
  const [selectedInstructorName, setSelectedInstructorName] = useState(
    data.instructor.name,
  );
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(liveClassSchema),
    defaultValues: {
      title: data.title,
      slug: data.slug,
      thumbnailKey: data.thumbnailKey || "",
      smallDescription: data.smallDescription,
      description: data.description,
      category: data.category as LiveClassSchemaType["category"],
      price: data.price,
      startDate: data.startDate,
      durationWeeks: data.durationWeeks,
      //   frequencyPerWeek: data.frequencyPerWeek,
      daysOfWeek: data.daysOfWeek as LiveClassSchemaType["daysOfWeek"],
      startTime: data.startTime,
      sessionDuration: data.sessionDuration,
      maxStudents: data.maxStudents || 0,
      status: data.status as LiveClassSchemaType["status"],
      instructorId: data.instructor.id,
    },
  });

  function onSubmit(values: LiveClassSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        editLiveClass(values, data.id),
      );

      if (error) {
        toast.error("Failed to update live class");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/admin/live-class");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-end">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="Slug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            className="w-fit"
            onClick={() => {
              const titleValue = form.getValues("title");
              const slug = slugify(titleValue || "", { lower: true });
              form.setValue("slug", slug, { shouldValidate: true });
            }}
          >
            Generate Slug <SparkleIcon className="ml-1" size={16} />
          </Button>
        </div>

        <FormField
          control={form.control}
          name="smallDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Small Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Small Description"
                  {...field}
                  className="min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnailKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail image</FormLabel>
              <FormControl>
                <Uploader
                  onChange={field.onChange}
                  value={field.value}
                  fileTypeAccepted="image"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructor</FormLabel>
                <FormControl>
                  <InstructorSelector
                    selectedInstructor={{
                      id: field.value,
                      name: selectedInstructorName,
                    }}
                    onSelect={(ins) => {
                      field.onChange(ins.id);
                      setSelectedInstructorName(ins.name);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="daysOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Days</FormLabel>
                <div className="relative">
                  <div
                    onClick={() => setOpenDays(!openDays)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                  >
                    <span className="text-muted-foreground">
                      {field.value?.length
                        ? field.value.length <= 3
                          ? field.value.join(", ")
                          : `${field.value.slice(0, 3).join(", ")} +${field.value.length - 3}`
                        : "Select days"}
                    </span>
                    <span>▾</span>
                  </div>

                  {openDays && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md p-1">
                      {weekDays.map((day) => {
                        const selected = field.value?.includes(day);
                        return (
                          <div
                            key={day}
                            onClick={() => {
                              let newValue = field.value || [];
                              if (selected) {
                                newValue = newValue.filter((d) => d !== day);
                              } else {
                                if (newValue.length >= 7) return;
                                newValue = [...newValue, day];
                              }
                              field.onChange(newValue);
                              form.setValue(
                                "frequencyPerWeek",
                                newValue.length,
                              );
                            }}
                            className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm ${
                              selected
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            <div className="mr-2 flex h-4 w-4 items-center">
                              {selected && <Check className="h-4 w-4" />}
                            </div>
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationWeeks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Weeks</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Price"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sessionDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxStudents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Students</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseStatus.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Hidden field for frequencyPerWeek */}
        <input type="hidden" {...form.register("frequencyPerWeek")} />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              Updating...
              <Loader2 className="animate-spin ml-1" />
            </>
          ) : (
            <>Update Live Class</>
          )}
        </Button>
      </form>
    </Form>
  );
}
