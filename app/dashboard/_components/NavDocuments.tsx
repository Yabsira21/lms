// "use client";

import Link from "next/link";
import { FileIcon } from "lucide-react";
import { getUserNotes } from "@/app/data/user/get-user-notes";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface NavDocumentsProps {
  className?: string;
}

export async function NavDocuments({ className }: NavDocumentsProps) {
  //   const [notes, setNotes] = React.useState<UserNotesType[]>([]);
  const notes = await getUserNotes();

  if (!notes.length) {
    return null; // or a placeholder
  }

  return (
    <div className={className}>
      <h4 className="px-3 pt-4 text-xs font-semibold text-muted-foreground uppercase">
        Notes
      </h4>
      <ul className="mt-1">
        {notes.map((note) => (
          <SidebarMenuItem key={note.id}>
            <SidebarMenuButton asChild>
              <Link href={`/dashboard`}>
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{note.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          //   <li key={note.id}>
          //     <Link
          //       href={`/documents/${note.id}`}
          //       className="flex items-center gap-2 px-3 py-1 rounded hover:bg-primary/50"
          //     >
          //       <FileIcon className="h-4 w-4 text-muted-foreground" />
          //       <span className="text-sm">{note.title}</span>
          //     </Link>
          //   </li>
        ))}
      </ul>
    </div>
  );
}
