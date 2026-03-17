import z from "zod";

export const courseLevel = ["Beginner", "Intermediate", "Advanced"] as const;
export const courseStatus = ["Draft", "Published", "Archieved"] as const;
export const courseCategories = [
  "Development",
  "Business",
  "Finance",
  "IT & Software",
  "Lnaguage",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
  "Teaching",
] as const;

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const liveClassSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title is too long"),

    slug: z.string().min(3, "Slug is required"),

    smallDescription: z
      .string()
      .min(3)
      .max(200, "Small description should be concise"),

    description: z.string().min(10, "Please provide a detailed description"),

    category: z.enum(courseCategories, {
      message: "Category is required",
    }),

    // Pricing for the entire cohort
    price: z.coerce.number().min(1, "Price must be at least 1"),

    startDate: z.coerce.date({
      error: (issue) => {
        // If the input is missing (undefined/null), it's a "required" error
        if (issue.input === undefined) return "Please select a start date";
        // Otherwise, handle it as a general invalid type/date
        return "That's not a valid date!";
      },
    }),

    durationInWeeks: z.coerce
      .number()
      .min(1, "Minimum duration is 1 week")
      .max(52, "Maximum duration is 1 year"),

    frequencyPerWeek: z.coerce
      .number()
      .min(1, "At least 1 session per week")
      .max(7, "Cannot exceed 7 sessions per week"),

    // Which specific days the class meets
    daysOfWeek: z
      .array(z.enum(weekDays))
      .min(1, "Select at least one day of the week"),

    // Time management
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:MM)",
    }),

    sessionDuration: z.coerce
      .number()
      .min(15, "Sessions must be at least 15 minutes")
      .max(480, "Sessions cannot exceed 8 hours"),

    maxStudents: z.coerce
      .number()
      .min(1, "Must allow at least 1 student")
      .optional(),

    status: z.enum(courseStatus).default("Draft"),
  })
  .refine((data) => data.daysOfWeek.length === data.frequencyPerWeek, {
    message: "Selected days must match the frequency per week",
    path: ["daysOfWeek"],
  });

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),

  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .max(2500, { message: "Description must not exceed 2500 characters" }),

  fileKey: z.string().min(1, { message: "File key is required" }),

  // Use z.coerce.number() to handle string -> number conversion automatically
  price: z.coerce.number().min(1, { message: "Price must be at least 1" }),

  duration: z.coerce
    .number()
    .min(1, { message: "Duration must be at least 1 minute" })
    .max(500, { message: "Duration cannot exceed 500 minutes" }),

  level: z.enum(courseLevel, {
    message: "Invalid course level selected",
  }),

  category: z.enum(courseCategories, {
    message: "Category is required",
  }),

  smallDescription: z
    .string()
    .min(3, { message: "Small description must be at least 3 characters long" })
    .max(200, { message: "Small description must not exceed 200 characters" }),

  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" }),

  status: z.enum(courseStatus, {
    message: "Invalid course status provided",
  }),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Chapter name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course ID" }),
});

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Chapter name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course ID" }),
  chapterId: z.string().uuid({ message: "Invalid chapter ID" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;

export type ChapterSchemaType = z.infer<typeof chapterSchema>;

export type LessonSchemaType = z.infer<typeof lessonSchema>;

export type LiveClassSchemaType = z.infer<typeof liveClassSchema>;
