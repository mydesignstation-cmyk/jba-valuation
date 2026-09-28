import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  PenLine,
  ShieldCheck,
  UploadCloud,
  Landmark,
  GitBranch,
  Users,
} from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  title: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
  permission: Permission;
  badge?: "notifications";
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    label: "Workflow",
    items: [
      { title: "Cases", to: "/cases", icon: FolderKanban, permission: "cases.view" },
      // The four role-scoped queues all read simply "My Cases" in the sidebar.
      // Each role only ever sees one of these (gated by permission), and users
      // already know their own role, so a single standard label is clearer than
      // "Maker Queue" / "Checker Queue" / "Uploader Queue". This is a label-only
      // change — routes (/my-cases, /maker, /checker, /uploader) are unchanged.
      { title: "My Cases", to: "/my-cases", icon: Briefcase, permission: "myCases.view" },
      { title: "My Cases", to: "/maker", icon: PenLine, permission: "maker.access" },
      { title: "My Cases", to: "/checker", icon: ShieldCheck, permission: "checker.access" },
      {
        title: "My Cases",
        to: "/uploader",
        icon: UploadCloud,
        permission: "uploader.access",
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Customers", to: "/customers", icon: Users, permission: "customers.view" },
      { title: "Banks", to: "/banks", icon: Landmark, permission: "masterData.view" },
      { title: "Branches", to: "/branches", icon: GitBranch, permission: "masterData.view" },
    ],
  },
];
