"use client";

import React, { Suspense } from "react";
import { AppSidebar } from "@/components/sidebar/new-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--sidebar-width-mobile": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
          "--header-height-mobile": "calc(var(--spacing) * 10)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-2 py-2 px-2 sm:gap-4 sm:py-4 sm:px-4 md:gap-6 md:py-6">
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
