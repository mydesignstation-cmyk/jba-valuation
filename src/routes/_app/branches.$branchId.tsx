import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/branches/$branchId")({
  head: () => pageMeta("Branch Detail", "Branch information."),
  beforeLoad: requirePermission("masterData.view"),
  component: Page,
});

function Page() {
  const { branchId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Branch Detail"
      description="Branch information."
      icon={GitBranch}
      message="Branch details will appear here."
      crumbs={[{ label: "Branches", link: { to: "/branches" } }, { label: branchId }]}
    />
  );
}
