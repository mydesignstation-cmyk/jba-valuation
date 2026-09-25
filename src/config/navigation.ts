import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, FolderKanban, Briefcase, PenLine, ShieldCheck, UploadCloud,
  Landmark, GitBranch, Bell, UserCircle,
} from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  title: string;
  to: LinkProps["to"];
  icon: LucideIcon;
  permission: Permission;
  badge?: "notifications";
}
export interface NavGroup { label: string; items: NavItem[] }

export const navigation: NavGroup[] = [
  { label: "Overview", items: [{ title: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" }] },
  {
    label: "Workflow",
    items: [
      { title: "Cases", to: "/cases", icon: FolderKanban, permission: "cases.view" },
      { title: "My Cases", to: "/my-cases", icon: Briefcase, permission: "myCases.view" },
      { title: "Maker Queue", to: "/maker", icon: PenLine, permission: "maker.access" },
      { title: "Checker Queue", to: "/checker", icon: ShieldCheck, permission: "checker.access" },
      { title: "Uploader Queue", to: "/uploader", icon: UploadCloud, permission: "uploader.access" },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Banks", to: "/banks", icon: Landmark, permission: "masterData.view" },
      { title: "Branches", to: "/branches", icon: GitBranch, permission: "masterData.view" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Notifications", to: "/notifications", icon: Bell, permission: "notifications.view", badge: "notifications" },
      { title: "Profile", to: "/profile", icon: UserCircle, permission: "profile.view" },
    ],
  },
];
