// app-sidebar.tsx
import Logo from "@/public/midjourney-dark.png";
import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { NavDocuments } from "./NavDocuments";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "IconDashboard", // Pass string instead of component
    },
    {
      title: "My Exams",
      url: "/dashboard/exams",
      icon: "IconReport", // or any icon you prefer
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: "IconSettings",
    },
    {
      title: "Get Help",
      url: "#",
      icon: "IconHelp",
    },
    {
      title: "Search",
      url: "#",
      icon: "IconSearch",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={Logo} alt="logo" className="size-5" />
                <span className="text-base font-semibold">LMS.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
