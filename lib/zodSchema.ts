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

  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(1, { message: "Price must be at least 1" })
  ),

  duration: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number()
      .min(1, { message: "Duration must be at least 1 minute" })
      .max(500, { message: "Duration cannot exceed 500 minutes" })
  ),

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

export type CourseSchemaType = z.infer<typeof courseSchema>;
// export type CourseSchemaType = {
//   title: string;
//   description: string;
//   fileKey: string;
//   price: number; // Change from number to unknown
//   duration: number; // Change from number to unknown
//   level: "Beginner" | "Intermediate" | "Advanced";
//   category:
//     | "Development"
//     | "Business"
//     | "Finance"
//     | "IT & Software"
//     | "Lnaguage"
//     | "Personal Development"
//     | "Design"
//     | "Marketing"
//     | "Health & Fitness"
//     | "Music"
//     | "Teaching";
//   smallDescription: string;
//   slug: string;
//   status: "Draft" | "Published" | "Archieved";
// };
