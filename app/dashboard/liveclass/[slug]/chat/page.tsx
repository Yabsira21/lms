import { getLiveClassSidebarData } from "@/app/data/live-class/get-live-class-sidebar-data";
import { getLiveClassChat } from "@/app/data/live-class/get-live-class-chat";
import { Chat } from "@/app/dashboard/_components/Chat";
// import { Chat } from "../_components/Chat";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export default async function LiveClassChatPage({ params }: iAppProps) {
  const { slug } = await params;
  const { liveClass } = await getLiveClassSidebarData(slug);
  const { messages, currentUser } = await getLiveClassChat(liveClass.id);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Group Chat</h1>
        <p className="text-muted-foreground mt-1">
          Chat with all enrolled students in {liveClass.title}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <Chat
          initialMessages={messages}
          liveClassId={liveClass.id}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
