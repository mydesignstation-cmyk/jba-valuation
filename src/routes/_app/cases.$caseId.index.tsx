import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/cases/$caseId/")({
  head: () => pageMeta("Case Detail", "Case information, documents and history."),
  beforeLoad: requirePermission("cases.detail"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Case Detail"
      description="Case information, documents and history."
      icon={FileText}
      message="Case details will appear here."
      crumbs={[{ label: "Cases", link: { to: "/cases" } }, { label: caseId }]}
    />
  );
}
