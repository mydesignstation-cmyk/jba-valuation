import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/my-cases")({
  head: () => pageMeta("My Cases", "Cases assigned to you for field visits."),
  beforeLoad: requirePermission("myCases.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="My Cases"
      description="Cases assigned to you for field visits."
      icon={Briefcase}
      message="Your assigned cases will appear here."
      crumbs={[{ label: "My Cases" }]}
    />
  );
}
