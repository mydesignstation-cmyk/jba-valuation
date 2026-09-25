import type { ReactNode } from "react";

/**
 * Shared application layout shell.
 * Dashboard and workflow screens will be wrapped in this later.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
