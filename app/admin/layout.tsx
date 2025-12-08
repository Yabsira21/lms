import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {/* <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {children}
            </div>
          </div>
        </div> */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col items-center px-4 lg:px-8">
            {/* Centered wide content */}
            <div className="w-full max-w-6xl flex flex-col gap-4 py-6 md:gap-8 md:py-8">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
