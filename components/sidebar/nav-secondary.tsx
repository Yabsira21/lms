"use client";

import * as React from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  IconSettings,
  IconHelp,
  IconSearch,
  // Import any other icons you might use
} from "@tabler/icons-react";

// Create a mapping of icon names to components
const iconMap = {
  IconSettings: IconSettings,
  IconHelp: IconHelp,
  IconSearch: IconSearch,
  // Add more icons as needed
} as const;

type IconName = keyof typeof iconMap;

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: string; // Changed from Icon to string
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            // Get the icon component from the mapping
            const IconComponent = item.icon
              ? iconMap[item.icon as IconName]
              : null;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    {IconComponent && <IconComponent />}
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
