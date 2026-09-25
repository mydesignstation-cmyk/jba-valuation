import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => pageMeta("Dashboard", "Overview of your valuation work."),
  beforeLoad: requirePermission("dashboard.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Overview of your valuation work."
      icon={LayoutDashboard}
      message="Your dashboard will appear here."
      crumbs={[{ label: "Dashboard" }]}
    />
  );
}
