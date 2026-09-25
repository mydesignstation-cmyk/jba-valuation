import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { requirePermission } from "@/lib/route-guard";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: requirePermission(),
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
