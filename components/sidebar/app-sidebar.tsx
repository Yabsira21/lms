// "use client";

// import * as React from "react";
// import {
//   IconCamera,
//   IconChartBar,
//   IconDashboard,
//   IconDatabase,
//   IconFileAi,
//   IconFileDescription,
//   IconFileWord,
//   IconFolder,
//   IconHelp,
//   IconInnerShadowTop,
//   IconListDetails,
//   IconReport,
//   IconSearch,
//   IconSettings,
//   IconUsers,
// } from "@tabler/icons-react";
// import Logo from "@/public/midjourney-dark.png";

// import { NavDocuments } from "@/components/sidebar/nav-documents";
// import { NavMain } from "@/components/sidebar/nav-main";
// import { NavSecondary } from "@/components/sidebar/nav-secondary";
// import { NavUser } from "@/components/sidebar/nav-user";
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar";
// import Link from "next/link";
// import Image from "next/image";

// const data = {
//   // user: {
//   //   name: "shadcn",
//   //   email: "m@example.com",
//   //   avatar: "/avatars/shadcn.jpg",
//   // },
//   navMain: [
//     {
//       title: "Dashboard",
//       url: "/admin",
//       icon: IconDashboard,
//     },
//     {
//       title: "Courses",
//       url: "/admin/courses",
//       icon: IconListDetails,
//     },
//     {
//       title: "Live Classes",
//       url: "/admin/live-class",
//       icon: IconListDetails,
//     },
//     //
//   ],
//   navClouds: [
//     {
//       title: "Capture",
//       icon: IconCamera,
//       isActive: true,
//       url: "#",
//       items: [
//         {
//           title: "Active Proposals",
//           url: "#",
//         },
//         {
//           title: "Archived",
//           url: "#",
//         },
//       ],
//     },
//     {
//       title: "Proposal",
//       icon: IconFileDescription,
//       url: "#",
//       items: [
//         {
//           title: "Active Proposals",
//           url: "#",
//         },
//         {
//           title: "Archived",
//           url: "#",
//         },
//       ],
//     },
//     {
//       title: "Prompts",
//       icon: IconFileAi,
//       url: "#",
//       items: [
//         {
//           title: "Active Proposals",
//           url: "#",
//         },
//         {
//           title: "Archived",
//           url: "#",
//         },
//       ],
//     },
//   ],
//   navSecondary: [
//     {
//       title: "Settings",
//       url: "#",
//       icon: IconSettings,
//     },
//     {
//       title: "Get Help",
//       url: "#",
//       icon: IconHelp,
//     },
//     {
//       title: "Search",
//       url: "#",
//       icon: IconSearch,
//     },
//   ],
//   // documents: [
//   //   {
//   //     name: "Data Library",
//   //     url: "#",
//   //     icon: IconDatabase,
//   //   },
//   //   {
//   //     name: "Reports",
//   //     url: "#",
//   //     icon: IconReport,
//   //   },
//   //   {
//   //     name: "Word Assistant",
//   //     url: "#",
//   //     icon: IconFileWord,
//   //   },
//   // ],
// };

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   return (
//     <Sidebar collapsible="offcanvas" {...props}>
//       <SidebarHeader>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton
//               asChild
//               className="data-[slot=sidebar-menu-button]:!p-1.5"
//             >
//               <Link href="/">
//                 <Image src={Logo} alt="logo" className="size-5" />
//                 <span className="text-base font-semibold">LMS.</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>
//       <SidebarContent>
//         <NavMain items={data.navMain} />
//         {/* <NavDocuments items={data.documents} /> */}
//         <NavSecondary items={data.navSecondary} className="mt-auto" />
//       </SidebarContent>
//       <SidebarFooter>
//         <NavUser />
//       </SidebarFooter>
//     </Sidebar>
//   );
// }

"use client";

import * as React from "react";
import {
  // Keep the imports for type safety, but we won't use them directly in the data
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import Logo from "@/public/midjourney-dark.png";

import { NavDocuments } from "@/components/sidebar/nav-documents";
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
import Link from "next/link";
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: "IconDashboard", // Changed to string
    },
    {
      title: "Courses",
      url: "/admin/courses",
      icon: "IconListDetails", // Changed to string
    },
    {
      title: "Live Classes",
      url: "/admin/live-class",
      icon: "IconListDetails", // Changed to string
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: "IconCamera", // Changed to string
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: "IconFileDescription", // Changed to string
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: "IconFileAi", // Changed to string
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: "IconSettings", // Changed to string
    },
    {
      title: "Get Help",
      url: "#",
      icon: "IconHelp", // Changed to string
    },
    {
      title: "Search",
      url: "#",
      icon: "IconSearch", // Changed to string
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
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
