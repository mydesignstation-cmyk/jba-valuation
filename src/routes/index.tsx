import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/")({
  head: () =>
    pageMeta(
      "Property Valuation Operations",
      "Case management for property valuation agencies working with banks.",
    ),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
