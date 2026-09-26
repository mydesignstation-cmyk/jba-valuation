import { createFileRoute } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/maker/$caseId")({
  head: () => pageMeta("Maker Review", "Review and edit the submitted field visit."),
  beforeLoad: requirePermission("maker.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Maker Review"
      description="Review and edit the submitted field visit."
      icon={PenLine}
      message="The Maker review screen will appear here."
      crumbs={[
        { label: "Cases", link: { to: "/cases" } },
        { label: caseId, link: { to: "/cases/$caseId", params: { caseId: caseId } } },
        { label: "Maker Review" },
      ]}
    />
  );
}
