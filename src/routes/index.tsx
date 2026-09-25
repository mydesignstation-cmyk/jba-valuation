import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockCases } from "@/mocks/cases";
import { stageLabels, statusColors, typography, spacing } from "@/lib/design-tokens";
import type { CaseStage } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Valuation Platform — Foundation Check" },
      { name: "description", content: "Placeholder confirming the property valuation platform foundation is working." },
      { property: "og:title", content: "Valuation Platform — Foundation Check" },
      { property: "og:description", content: "Placeholder confirming the property valuation platform foundation is working." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const checks = ["React + TypeScript", "TanStack Router", "Tailwind CSS tokens", "shadcn/ui", "Zod schemas", "Mock data"];

function Index() {
  const stages = Object.keys(stageLabels) as CaseStage[];
  return (
    <AppLayout>
      <main className={`mx-auto max-w-4xl ${spacing.page} ${spacing.section}`}>
        <header className="space-y-2">
          <Badge variant="secondary">Foundation ready</Badge>
          <h1 className={typography.h1}>Property Valuation Platform</h1>
          <p className={typography.small}>This placeholder confirms the frontend foundation is working.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Foundation checks</CardTitle>
            <CardDescription>Core building blocks in place.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {checks.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-primary" /> {c}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case stage colors</CardTitle>
            <CardDescription>Status tokens for every workflow stage.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <span key={s} className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusColors[s]}`}>
                {stageLabels[s]}
              </span>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => toast.success(`Loaded ${mockCases.length} sample case(s)`)}>Test notification</Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltips are working</TooltipContent>
          </Tooltip>
        </div>
      </main>
    </AppLayout>
  );
}
