import { createFileRoute } from "@tanstack/react-router";
import { ErrorState } from "@/components/app/ErrorState";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/500")({
  head: () =>
    pageMeta("500 Something went wrong", "An unexpected error occurred. Please try again."),
  component: () => (
    <ErrorState
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred. Please try again."
      onRetry={() => window.location.reload()}
    />
  ),
});
