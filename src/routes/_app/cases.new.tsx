import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/cases/new")({
  head: () => pageMeta("New Case", "Create a new valuation case."),
  beforeLoad: requirePermission("cases.create"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="New Case"
      description="Create a new valuation case."
      icon={FilePlus2}
      message="The new case form will appear here."
      crumbs={[{ label: "Cases", link: { to: "/cases" } }, { label: "New Case" }]}
    />
  );
}
