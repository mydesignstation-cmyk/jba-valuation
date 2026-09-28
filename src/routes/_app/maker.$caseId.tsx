import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, PenLine } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { isMakerCasePending } from "@/lib/case-format";
import { SubmittedFieldVisit } from "@/components/case/SubmittedFieldVisit";
import { FieldVisitWizard, useAutoFill } from "@/routes/_app/cases.$caseId.field-visit";
import { api_getCase } from "@/data/case.functions";
import { api_getCaseFieldVisit } from "@/data/fieldVisit.functions";
import { api_getSiteEngineer, api_getMaker } from "@/data/user.functions";

export const Route = createFileRoute("/_app/maker/$caseId")({
  head: () => pageMeta("Maker Review", "Review and edit the submitted field visit."),
  beforeLoad: requirePermission("maker.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const autoFill = useAutoFill(caseId);

  // The case: drives the stage gate (edit is only allowed while the case sits
  // with the Maker) and provides the assigned-maker id.
  const { data: valuationCase } = useQuery({
    queryKey: ["cases", caseId],
    queryFn: () => api_getCase(caseId),
    enabled: !!caseId,
  });

  // The submitted field visit for this case.
  const {
    data: fieldVisit,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["case-field-visit", caseId],
    queryFn: async () => {
      const visit = await api_getCaseFieldVisit(caseId);
      return visit ?? null;
    },
    enabled: !!caseId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Resolve names for the audit banner: the original submitter (site engineer)
  // and, when edited, the Maker who last edited.
  const { data: engineer } = useQuery({
    queryKey: ["site-engineer", fieldVisit?.engineerId],
    queryFn: () => api_getSiteEngineer(fieldVisit!.engineerId),
    enabled: !!fieldVisit?.engineerId,
  });
  const { data: updater } = useQuery({
    queryKey: ["maker", fieldVisit?.updatedById],
    queryFn: () => api_getMaker(fieldVisit!.updatedById!),
    enabled: !!fieldVisit?.updatedById,
  });

  const canEdit = !!valuationCase && isMakerCasePending(valuationCase.stage);

  const header = useMemo(
    () => (
      <PageHeader
        title="Maker Review"
        description="Review and edit the submitted field visit."
        crumbs={[
          { label: "Cases", link: { to: "/cases/$caseId", params: { caseId } } },
          { label: caseId, link: { to: "/cases/$caseId", params: { caseId } } },
          { label: "Maker Review" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/cases/$caseId" params={{ caseId }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Link>
          </Button>
        }
      />
    ),
    [caseId],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!fieldVisit) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No field visit has been submitted for this case yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {isEditing ? (
        <FieldVisitWizard
          caseId={caseId}
          autoFill={autoFill}
          engineerName={engineer?.name ?? "—"}
          mode="edit"
          initialVisit={fieldVisit}
          onSubmitted={(visit) => {
            queryClient.setQueryData(["case-field-visit", caseId], visit);
            queryClient.invalidateQueries({ queryKey: ["case-field-visit", caseId] });
            queryClient.invalidateQueries({ queryKey: ["field-visit", caseId] });
            queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
            queryClient.invalidateQueries({ queryKey: ["maker-cases"] });
            setIsEditing(false);
          }}
        />
      ) : (
        <SubmittedFieldVisit
          visit={fieldVisit}
          autoFill={autoFill}
          engineerName={engineer?.name ?? "—"}
          updatedByName={updater?.name ?? undefined}
          headerAction={
            canEdit ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-fit"
                onClick={() => setIsEditing(true)}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Edit Field Visit
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
