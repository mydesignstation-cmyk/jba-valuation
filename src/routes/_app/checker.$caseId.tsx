import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, PenLine, Send } from "lucide-react";
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
import { getSessionToken } from "@/lib/auth-client";
import { SubmittedFieldVisit } from "@/components/case/SubmittedFieldVisit";
import { FieldVisitWizard, useAutoFill } from "@/routes/_app/cases.$caseId.field-visit";
import { api_getCase, api_submitToUploader } from "@/data/case.functions";
import {
  api_getCaseFieldVisit,
  api_updateFieldVisitByChecker,
} from "@/data/fieldVisit.functions";
import { api_getSiteEngineer, api_getMaker, api_getChecker } from "@/data/user.functions";

export const Route = createFileRoute("/_app/checker/$caseId")({
  head: () => pageMeta("Checker Review", "Review and edit the submitted field visit."),
  beforeLoad: requirePermission("checker.access"),
  component: Page,
});

function Page() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const autoFill = useAutoFill(caseId);

  // Load the case to gate edits to CHECKER_PENDING only.
  const { data: valuationCase } = useQuery({
    queryKey: ["cases", caseId],
    queryFn: () => api_getCase(caseId),
    enabled: !!caseId,
  });

  // The submitted field visit.
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

  // Resolve names for all three audit lines.
  const { data: engineer } = useQuery({
    queryKey: ["site-engineer", fieldVisit?.engineerId],
    queryFn: () => api_getSiteEngineer(fieldVisit!.engineerId),
    enabled: !!fieldVisit?.engineerId,
  });
  const { data: makerEditor } = useQuery({
    queryKey: ["maker", fieldVisit?.updatedById],
    queryFn: () => api_getMaker(fieldVisit!.updatedById!),
    enabled: !!fieldVisit?.updatedById,
  });
  const { data: checkerEditor } = useQuery({
    queryKey: ["checker", fieldVisit?.checkerUpdatedById],
    queryFn: () => api_getChecker(fieldVisit!.checkerUpdatedById!),
    enabled: !!fieldVisit?.checkerUpdatedById,
  });

  // Checker can only edit while the case is at CHECKER_PENDING.
  const canEdit = !!valuationCase && valuationCase.stage === "CHECKER_PENDING";
  const canSubmitToUploader = canEdit && !!fieldVisit;

  const submitToUploader = useMutation({
    mutationFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_submitToUploader(token, caseId);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      queryClient.invalidateQueries({ queryKey: ["uploader-cases"] });
      setConfirmSubmit(false);
      toast.success("Case submitted to the uploader");
      navigate({ to: "/checker" });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to submit case to uploader");
    },
  });

  const header = useMemo(
    () => (
      <PageHeader
        title="Checker Review"
        description="Review and, if needed, correct the submitted field visit."
        crumbs={[
          { label: "Cases", link: { to: "/cases/$caseId", params: { caseId } } },
          { label: caseId, link: { to: "/cases/$caseId", params: { caseId } } },
          { label: "Checker Review" },
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
            // Use the checker-specific update function.
            // Note: onSubmitted here receives the saved visit back after the
            // wizard calls api_updateFieldVisitByChecker via its mutation.
            queryClient.setQueryData(["case-field-visit", caseId], visit);
            queryClient.invalidateQueries({ queryKey: ["case-field-visit", caseId] });
            queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
            queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
            setIsEditing(false);
          }}
          updateFn={api_updateFieldVisitByChecker}
        />
      ) : (
        <SubmittedFieldVisit
          visit={fieldVisit}
          autoFill={autoFill}
          engineerName={engineer?.name ?? "—"}
          updatedByName={makerEditor?.name ?? undefined}
          checkerUpdatedByName={checkerEditor?.name ?? undefined}
          headerAction={
            canEdit ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setIsEditing(true)}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Edit Field Visit
                </Button>
                {canSubmitToUploader && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="w-fit"
                    onClick={() => setConfirmSubmit(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit to Uploader
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
            <AlertDialogTitle>Submit this case to the Uploader?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends the case forward to the Uploader for the final upload. After submitting
              you will no longer be able to edit the field visit for this case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitToUploader.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submitToUploader.mutate();
              }}
              disabled={submitToUploader.isPending}
            >
              {submitToUploader.isPending ? "Submitting..." : "Submit to Uploader"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
