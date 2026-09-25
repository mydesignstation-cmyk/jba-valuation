import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/uploader/$caseId")({
  head: () => pageMeta("Uploader", "Perform the final upload for this case."),
  beforeLoad: requirePermission("uploader.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  return (
    <PlaceholderPage
      title="Uploader"
      description="Perform the final upload for this case."
      icon={UploadCloud}
      message="The Uploader screen will appear here."
      crumbs={[{ label: "Cases", link: { to: "/cases" } }, { label: caseId, link: { to: "/cases/$caseId", params: { caseId: caseId } } }, { label: "Uploader" }]}
    />
  );
}
