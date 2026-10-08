import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Hand, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { isMakerCasePending } from "@/lib/case-format";
import { getSessionToken } from "@/lib/auth-client";
import { SubmittedFieldVisit } from "@/components/case/SubmittedFieldVisit";
import { FieldVisitWizard, useAutoFill } from "@/routes/_app/cases.$caseId.field-visit";
import { api_getCase, api_submitToChecker } from "@/data/case.functions";
import { api_getCaseFieldVisit } from "@/data/fieldVisit.functions";
import { api_getSiteEngineer, api_getMaker, api_getChecker } from "@/data/user.functions";

export const Route = createFileRoute("/_app/maker/$caseId")({
  head: () => pageMeta("Maker Review", "Review and edit the submitted field visit."),
  beforeLoad: requirePermission("maker.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

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
  const { data: checkerEditor } = useQuery({
    queryKey: ["checker", fieldVisit?.checkerUpdatedById],
    queryFn: () => api_getChecker(fieldVisit!.checkerUpdatedById!),
    enabled: !!fieldVisit?.checkerUpdatedById,
  });

  const canEdit = !!valuationCase && isMakerCasePending(valuationCase.stage);

  // "Submit to Checker" — advance the case to the Checker's review stage. Only
  // possible while the case is still with the Maker and a visit is submitted.
  const canSubmitToChecker = canEdit && !!fieldVisit;

  const submitToChecker = useMutation({
    mutationFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_submitToChecker(token, caseId);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["maker-cases"] });
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      setConfirmSubmit(false);
      toast.success("Case submitted to the checker for review");
      navigate({ to: "/maker" });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to submit case to checker");
    },
  });

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
          checkerUpdatedByName={checkerEditor?.name ?? undefined}
          headerAction={
            canEdit ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="sm"
                  className="w-fit bg-red-600 text-white hover:bg-red-700"
                >
                  <Hand className="mr-2 h-4 w-4" />
                  Hold
                </Button>
                {canSubmitToChecker && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="w-fit"
                    onClick={() => setConfirmSubmit(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit to Checker
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
      )}

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this case to the Checker?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends the case forward to the Checker for review. After submitting you will no
              longer be able to edit the field visit for this case. Make sure your review is
              complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitToChecker.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submitToChecker.mutate();
              }}
              disabled={submitToChecker.isPending}
            >
              {submitToChecker.isPending ? "Submitting..." : "Submit to Checker"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
