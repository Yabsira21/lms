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
    "Select a new instructor",
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
                    <SelectTrigger className="w-full">
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
                    // value={field.value ?? ""}
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
                    placeholder="Enter max students"
                    // min={1}
                    // max={50}
                    value={field.value as number | undefined}
                    onChange={(e) => {
                      let value = Number(e.target.value);
                      // if (value < 1) value = 1;
                      // if (value > 50) value = 50;
                      field.onChange(value);
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Value" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courseStatus.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Hidden field for frequencyPerWeek */}
        {/* <input type="hidden" {...form.register("frequencyPerWeek")} /> */}

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
