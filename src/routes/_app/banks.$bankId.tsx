import { createFileRoute } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/banks/$bankId")({
  head: () => pageMeta("Bank Detail", "Bank information and branches."),
  beforeLoad: requirePermission("masterData.view"),
  component: Page,
});

function Page() {
  const { bankId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Bank Detail"
      description="Bank information and branches."
      icon={Landmark}
      message="Bank details will appear here."
      crumbs={[{ label: "Banks", link: { to: "/banks" } }, { label: bankId }]}
    />
  );
}
