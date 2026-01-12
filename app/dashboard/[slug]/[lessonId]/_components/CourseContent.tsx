import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { useContructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle } from "lucide-react";

interface iAppProps {
  data: LessonContentType;
}

export default function CourseContent({ data }: iAppProps) {
  function VideoPlayer({
    thumbnailKey,
    videoKey,
  }: {
    thumbnailKey: string;
    videoKey: string;
  }) {
    const videoUrl = useContructUrl(videoKey);
    const thumbnailUrl = useContructUrl(thumbnailKey);

    if (!videoKey) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            This lesson doesn't have video yet
          </p>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-black rounded=lg relative overflow-hidden">
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-background pl-6">
      <VideoPlayer
        thumbnailKey={data.thumbnailKey ?? ""}
        videoKey={data.videoKey ?? ""}
      />
      <div className="py-4 border-b">
        <Button variant="outline">
          <CheckCircle className="size-4 mr-2 text-green-500" />
          Mark as Complete
        </Button>
      </div>

      <div className="space-y-3 pt-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground ">
          {data.title}
        </h1>
        {data.description && (
          <RenderDescription json={JSON.parse(data.description)} />
        )}
      </div>
    </div>
  );
}
