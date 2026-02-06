// nav-main.tsx (client component)
"use client";

import {
  IconCirclePlusFilled,
  IconDashboard,
  IconSettings,
  IconHelp,
  IconSearch,
  // Import all icons you might use
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Create a mapping of icon names to components
const iconMap = {
  IconDashboard: IconDashboard,
  IconSettings: IconSettings,
  IconHelp: IconHelp,
  IconSearch: IconSearch,
  IconCirclePlusFilled: IconCirclePlusFilled,
  // Add more as needed
} as const;

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string; // Changed from Icon to string
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-0.5">
        {pathname.startsWith("/admin") && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-0.5">
              <SidebarMenuButton
                asChild
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <Link href="/admin/courses/create">
                  <IconCirclePlusFilled />
                  <span>Quick Create</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            // Get the icon component from the mapping
            const IconComponent = item.icon
              ? iconMap[item.icon as keyof typeof iconMap]
              : null;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link
                    href={item.url}
                    className={cn(
                      pathname === item.url &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={cn(pathname === item.url && "text-primary")}
                      />
                    )}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
