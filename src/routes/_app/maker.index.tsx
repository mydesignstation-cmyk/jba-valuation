import { createFileRoute } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/maker/")({
  head: () => pageMeta("Maker Queue", "Cases waiting for Maker review."),
  beforeLoad: requirePermission("maker.access"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Maker Queue"
      description="Cases waiting for Maker review."
      icon={PenLine}
      message="The Maker queue will appear here."
      crumbs={[{ label: "Maker Queue" }]}
    />
  );
}
