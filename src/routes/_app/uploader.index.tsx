import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/uploader/")({
  head: () => pageMeta("Uploader Queue", "Cases ready for final upload."),
  beforeLoad: requirePermission("uploader.access"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Uploader Queue"
      description="Cases ready for final upload."
      icon={UploadCloud}
      message="The Uploader queue will appear here."
      crumbs={[{ label: "Uploader Queue" }]}
    />
  );
}
