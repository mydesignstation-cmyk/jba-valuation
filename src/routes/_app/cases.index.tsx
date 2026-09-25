import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/cases/")({
  head: () => pageMeta("Cases", "All valuation cases."),
  beforeLoad: requirePermission("cases.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Cases"
      description="All valuation cases."
      icon={FolderKanban}
      message="Case management will appear here."
      crumbs={[{ label: "Cases" }]}
      actions={<Button asChild><Link to="/cases/new"><Plus className="mr-2 h-4 w-4" />New Case</Link></Button>}
    />
  );
}
