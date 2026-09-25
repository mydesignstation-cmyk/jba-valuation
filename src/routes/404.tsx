import { createFileRoute } from "@tanstack/react-router";
import { ErrorState } from "@/components/app/ErrorState";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/404")({
  head: () => pageMeta("404 Page not found", "The page you're looking for doesn't exist or has been moved."),
  component: () => <ErrorState code="404" title="Page not found" message="The page you're looking for doesn't exist or has been moved." />,
});
