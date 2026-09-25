import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, type Crumb } from "./PageHeader";

export function PlaceholderPage({ title, description, icon: Icon, crumbs, message, actions }: {
  title: string; description: string; icon: LucideIcon; crumbs: Crumb[]; message: string; actions?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} crumbs={crumbs} actions={actions} />
      <Card className="border-dashed shadow-card">
        <CardContent className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <p className="font-medium">{message}</p>
          <p className="max-w-sm text-sm text-muted-foreground">This screen is a placeholder and will be built in a later step.</p>
        </CardContent>
      </Card>
    </div>
  );
}
