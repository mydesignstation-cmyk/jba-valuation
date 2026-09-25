import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/cases/$caseId/field-visit")({
  head: () => pageMeta("Field Visit", "Site inspection details for this case."),
  beforeLoad: requirePermission("fieldVisit.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Field Visit"
      description="Site inspection details for this case."
      icon={MapPin}
      message="The field visit form will appear here."
      crumbs={[{ label: "Cases", link: { to: "/cases" } }, { label: caseId, link: { to: "/cases/$caseId", params: { caseId: caseId } } }, { label: "Field Visit" }]}
    />
  );
}
