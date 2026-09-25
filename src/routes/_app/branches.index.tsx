import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/branches/")({
  head: () => pageMeta("Branches", "Bank branches."),
  beforeLoad: requirePermission("masterData.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Branches"
      description="Bank branches."
      icon={GitBranch}
      message="Branch records will appear here."
      crumbs={[{ label: "Branches" }]}
    />
  );
}
