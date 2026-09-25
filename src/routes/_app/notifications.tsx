import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/notifications")({
  head: () => pageMeta("Notifications", "Updates about your cases."),
  beforeLoad: requirePermission("notifications.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Notifications"
      description="Updates about your cases."
      icon={Bell}
      message="Your notifications will appear here."
      crumbs={[{ label: "Notifications" }]}
    />
  );
}
