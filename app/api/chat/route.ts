import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { messages, lessonId } = await req.json();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return new Response("Lesson context not found", { status: 404 });
    }

    const systemPrompt = `
You are an expert AI tutor for the course: "${lesson.chapter.course.title}".
You are helping with lesson: "${lesson.title}"

LESSON DESCRIPTION:
${lesson.description || "No description provided"}

COURSE OVERVIEW:
${lesson.chapter.course.smallDescription}

INSTRUCTIONS:
- Focus on the lesson context.
- Be clear and educational.
- If question is outside the lesson, say so briefly.
`;

    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
