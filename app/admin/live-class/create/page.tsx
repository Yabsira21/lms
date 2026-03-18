"use client";

import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { tryCatch } from "@/hooks/try-catch";
import {
  courseCategories,
  courseStatus,
  liveClassSchema,
  LiveClassSchemaType,
} from "@/lib/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  Loader2,
  PlusIcon,
  SparkleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
// import { CreateCourse } from "./actions";
import { useConfetti } from "@/hooks/use-confetti";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InstructorSelector } from "../_components/InstructorSelector";
import { CreateLiveClass } from "./action";
// import React from "react";
// import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function LiveClassCreationPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { triggerConfetti } = useConfetti();
  const [open, setOpen] = useState(false);
  const [selectedInstructorName, setSelectedInstructorName] =
    useState<string>("");

  //    const [date, setDate] = React.useState<Date>()

  //   useEffect(() => {
  //     const handleClickOutside = () => setOpen(false);
  //     window.addEventListener("click", handleClickOutside);
  //     return () => window.removeEventListener("click", handleClickOutside);
  //   }, []);

  const classDaysOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;
  // REMOVED <CourseSchemaType> generic here to allow TS to infer types from the resolver
  const form = useForm({
    resolver: zodResolver(liveClassSchema),
    defaultValues: {
      title: "",
      slug: "",
      thumbnailKey: "",
      smallDescription: "",
      description: "",
      category: "Development",
      price: 0,
      startDate: undefined,
      durationWeeks: 0,
      // frequencyPerWeek: 0,
      daysOfWeek: [],
      startTime: "",
      sessionDuration: 0,
      maxStudents: 0,
      status: "Draft",
      //   duration: 0,
      //   level: "Beginner",

      //   smallDescription: "",
    },
  });

  // function onSubmit(values: LiveClassSchemaType) {
  //   // startTransition(async () => {
  //   //   const { data: result, error } = await tryCatch(CreateCourse(values));
  //   //   if (error) {
  //   //     toast.error("Failed to create course");
  //   //     return;
  //   //   }
  //   //   if (result.status === "success") {
  //   //     toast.success(result.message);
  //   //     triggerConfetti();
  //   //     form.reset();
  //   //     router.push("/admin/courses");
  //   //   } else if (result.status === "error") {
  //   //     toast.error(result.message);
  //   //   }
  //   // });
  // }
  function onSubmit(values: LiveClassSchemaType) {
    console.log(`hello, ${values}`);
    startTransition(async () => {
      const { data: result, error } = await tryCatch(CreateLiveClass(values));

      if (error) {
        toast.error("Failed to create live class");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
        form.reset();
        setSelectedInstructorName(""); // Reset instructor name
        router.push("/admin/live-class");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Link href="/admin/live-class">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl">Create Live Class</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide basic information about live class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("🔥 FORM VALIDATION ERRORS:", errors);
                toast.error("Please check the form for errors");
              })}
            >
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
                    const slug = slugify(titleValue || "", { lower: true }); // Added safety check and options

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
                      {/* <Textarea
                          placeholder="Description"
                          {...field}
                          className="min-h-[120px]"
                        /> */}
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
                      <FormControl>
                        {/* <Input placeholder="thumbnail url" {...field} /> */}
                        <Uploader
                          onChange={field.onChange}
                          value={field.value}
                          fileTypeAccepted="image"
                        />
                      </FormControl>
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

                {/* <FormField
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Days</FormLabel>

                        <div className="relative">
                      
                          <div
                            className="w-full border rounded-md px-3 py-2 cursor-pointer flex justify-between items-center"
                            onClick={() =>
                              document
                                .getElementById("days-dropdown")
                                ?.classList.toggle("hidden")
                            }
                          >
                            <span className="text-sm">
                              {field.value?.length > 0
                                ? field.value.join(", ")
                                : "Select days"}
                            </span>
                            <span>▾</span>
                          </div>

                        
                          <div
                            id="days-dropdown"
                            className="absolute z-10 mt-1 w-full border bg-white rounded-md shadow-md hidden p-2 space-y-1"
                          >
                            {classDaysOptions.map((day) => {
                              const selected = field.value?.includes(day);

                              return (
                                <div
                                  key={day}
                                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    let newValue = field.value || [];

                                    if (selected) {
                                      newValue = newValue.filter(
                                        (d) => d !== day,
                                      );
                                    } else {
                                      if (newValue.length >= 5) return;
                                      newValue = [...newValue, day];
                                    }

                                    field.onChange(newValue);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    readOnly
                                  />
                                  <span>{day}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}

                <FormField
                  control={form.control}
                  name="daysOfWeek"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Class Days</FormLabel>

                        <div className="relative">
                          {/* Trigger */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(!open);
                            }}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer overflow-hidden"
                          >
                            <span className="block max-w-[calc(100%-20px)] truncate text-muted-foreground">
                              {field.value?.length
                                ? field.value.length <= 2
                                  ? field.value.join(", ")
                                  : `${field.value.slice(0, 2).join(", ")} +${field.value.length - 2}`
                                : "Select days"}
                            </span>
                            <span className="text-muted-foreground">▾</span>
                          </div>

                          {/* Dropdown */}
                          {open && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md p-1">
                              {classDaysOptions.map((day) => {
                                const selected = field.value?.includes(day);

                                return (
                                  <div
                                    key={day}
                                    onClick={() => {
                                      let newValue = field.value || [];

                                      if (selected) {
                                        newValue = newValue.filter(
                                          (d) => d !== day,
                                        );
                                      } else {
                                        if (newValue.length >= 7) return;
                                        newValue = [...newValue, day];
                                      }

                                      field.onChange(newValue);

                                      // 🔥 AUTO-SET frequencyPerWeek based on days selected
                                      // form.setValue(
                                      //   "frequencyPerWeek",
                                      //   newValue.length,
                                      // );
                                    }}
                                    className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors
                      ${
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                                  >
                                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                      {selected && (
                                        <Check className="h-4 w-4" />
                                      )}
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
                    );
                  }}
                />

                {/* start date lies here */}
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
                              className={`w-full justify-start text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />

                              {field.value ? (
                                format(field.value as Date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value as Date | undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
                          placeholder="Enter number of weeks"
                          min={1}
                          max={52}
                          value={field.value as number | undefined} // ✅ cast here
                          onChange={(e) => {
                            let value = Number(e.target.value);
                            if (value < 1) value = 1;
                            if (value > 52) value = 52;
                            field.onChange(value);
                          }}
                          onBlur={field.onBlur}
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
                        <Input type="time" placeholder="HH:MM" {...field} />
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
                          // value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
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
                          placeholder="Enter session duration"
                          min={30}
                          max={180}
                          value={field.value as number | undefined}
                          onChange={(e) => {
                            let value = Number(e.target.value);
                            if (value < 30) value = 30;
                            if (value > 180) value = 180;
                            field.onChange(value);
                          }}
                          onBlur={field.onBlur}
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
                          min={1}
                          max={50}
                          value={field.value as number | undefined}
                          onChange={(e) => {
                            let value = Number(e.target.value);
                            if (value < 1) value = 1;
                            if (value > 50) value = 50;
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

              {/* <FormField
                control={form.control}
                name="instructorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor</FormLabel>
                    <FormControl>
                      <InstructorSelector
                        selectedInstructor={
                          field.value
                            ? { id: field.value, name: "Selected Instructor" } // Temp, replace with API later
                            : undefined
                        }
                        onSelect={(ins) => field.onChange(ins.id)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <FormField
                control={form.control}
                name="instructorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor</FormLabel>
                    <FormControl>
                      <InstructorSelector
                        selectedInstructor={
                          field.value && selectedInstructorName
                            ? { id: field.value, name: selectedInstructorName }
                            : undefined
                        }
                        onSelect={(ins) => {
                          console.log("Selected instructor:", ins); // Check what ID format you're getting
                          field.onChange(ins.id);
                          setSelectedInstructorName(ins.name); // Store name for display
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    Creating...
                    <Loader2 className="animate-spin ml-1" />
                  </>
                ) : (
                  <>
                    Create Live Class <PlusIcon className="ml-1" size={16} />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
