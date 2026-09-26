import { createFileRoute } from "@tanstack/react-router";
import { ErrorState } from "@/components/app/ErrorState";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/403")({
  head: () =>
    pageMeta(
      "403 Access denied",
      "You don't have permission to view this page with your current role.",
    ),
  component: () => (
    <ErrorState
      code="403"
      title="Access denied"
      message="You don't have permission to view this page with your current role."
    />
  ),
});
