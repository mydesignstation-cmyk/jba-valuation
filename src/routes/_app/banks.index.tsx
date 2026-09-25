import { createFileRoute } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/banks/")({
  head: () => pageMeta("Banks", "Banks you perform valuations for."),
  beforeLoad: requirePermission("masterData.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Banks"
      description="Banks you perform valuations for."
      icon={Landmark}
      message="Bank records will appear here."
      crumbs={[{ label: "Banks" }]}
    />
  );
}
