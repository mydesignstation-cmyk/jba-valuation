import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/checker/")({
  head: () => pageMeta("Checker Queue", "Cases waiting for Checker review."),
  beforeLoad: requirePermission("checker.access"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Checker Queue"
      description="Cases waiting for Checker review."
      icon={ShieldCheck}
      message="The Checker queue will appear here."
      crumbs={[{ label: "Checker Queue" }]}
    />
  );
}
