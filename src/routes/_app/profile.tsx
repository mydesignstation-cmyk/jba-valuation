import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_app/profile")({
  head: () => pageMeta("Profile", "Your account information."),
  beforeLoad: requirePermission("profile.view"),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Profile"
      description="Your account information."
      icon={UserCircle}
      message="Profile settings will appear here."
      crumbs={[{ label: "Profile" }]}
    />
  );
}
