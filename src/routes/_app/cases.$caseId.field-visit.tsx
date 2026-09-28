import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { useCurrentUser } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/cases/$caseId/field-visit")({
  head: () => pageMeta("Field Visit", "Site inspection details for this case."),
  beforeLoad: requirePermission("fieldVisit.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();

  // Site Engineers cannot view the admin-only /cases list; point them at their
  // own "My Cases" instead so the breadcrumb doesn't lead to a 403.
  const currentUser = useCurrentUser();
  const listsAllCases = can(currentUser?.role, "cases.view");
  const backTo = listsAllCases ? "/cases" : "/my-cases";
  const backLabel = listsAllCases ? "Cases" : "My Cases";

  return (
    <PlaceholderPage
      title="Field Visit"
      description="Site inspection details for this case."
      icon={MapPin}
      message="The field visit form will appear here."
      crumbs={[
        { label: backLabel, link: { to: backTo } },
        { label: caseId, link: { to: "/cases/$caseId", params: { caseId: caseId } } },
        { label: "Field Visit" },
      ]}
    />
  );
}
