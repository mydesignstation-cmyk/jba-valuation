import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/checker/$caseId")({
  head: () => pageMeta("Checker Review", "Review the Maker-completed case."),
  beforeLoad: requirePermission("checker.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Checker Review"
      description="Review the Maker-completed case."
      icon={ShieldCheck}
      message="The Checker review screen will appear here."
      crumbs={[{ label: "Cases", link: { to: "/cases" } }, { label: caseId, link: { to: "/cases/$caseId", params: { caseId: caseId } } }, { label: "Checker Review" }]}
    />
  );
}
