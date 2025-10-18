"use client"

import type * as React from "react"
import {
  IconDatabase,
  IconSettings,
  IconHelp,
  IconCommand,
  IconBrandGithub,
  IconFileAnalytics,
  IconChartLine,
  IconFileExport,
  IconGitMerge,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Parquet Viewer",
      url: "/parquet-viewer",
      icon: IconDatabase,
    },
    {
      title: "Query Builder",
      url: "/query-builder",
      icon: IconCommand,
    },
    {
      title: "Data Profiling",
      url: "/data-profiling",
      icon: IconFileAnalytics,
    },
    {
      title: "Multi-File Analysis",
      url: "/multi-file",
      icon: IconGitMerge,
    },
    {
      title: "Visualizations",
      url: "/visualizations",
      icon: IconChartLine,
    },
    {
      title: "Export & Share",
      url: "/export",
      icon: IconFileExport,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconCommand,
      onClick: () => {
        const event = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      },
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/parquet-viewer">
                <IconDatabase className="!size-5" />
                <span className="text-base font-semibold">DuckDB Parquet Viewer</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
        <div className="border-sidebar-border border-t p-1">
          <a
            href="https://github.com/arangates/duckdb-wasm-parquet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
          >
            <IconBrandGithub className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">GitHub</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
