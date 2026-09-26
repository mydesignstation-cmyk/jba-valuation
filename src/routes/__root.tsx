import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { bootstrapSession, isBootstrapped } from "../lib/auth-client";
import { Toaster } from "@/components/ui/sonner";
import { ErrorState } from "@/components/app/ErrorState";
import { TooltipProvider } from "@/components/ui/tooltip";

function NotFoundComponent() {
  return (
    <ErrorState
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <ErrorState
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred. Please try again."
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ValuCase — Property Valuation Operations" },
      {
        name: "description",
        content: "Case management for property valuation agencies working with banks.",
      },
      { property: "og:title", content: "ValuCase — Property Valuation Operations" },
      {
        property: "og:description",
        content: "Case management for property valuation agencies working with banks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Restore any existing Neon Auth session on first client render so the UI
  // (topbar, sidebar) reflects the logged-in user. The route guard also
  // bootstraps on demand; this keeps the two in sync without a flash.
  useEffect(() => {
    if (!isBootstrapped()) void bootstrapSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
