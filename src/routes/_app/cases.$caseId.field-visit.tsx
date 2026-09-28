import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormActions } from "@/components/app/FormActions";
import { PageHeader } from "@/components/app/PageHeader";
import { requirePermission } from "@/lib/route-guard";
import { useCurrentUser, getSessionToken } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";
import { fieldVisitFormSchema, type FieldVisitFormValues } from "@/schemas/fieldVisit.schema";
import { api_getMyFieldVisit, api_submitFieldVisit } from "@/data/fieldVisit.functions";
import type { FieldVisit } from "@/types";

export const Route = createFileRoute("/_app/cases/$caseId/field-visit")({
  head: () => pageMeta("Field Visit", "Site inspection details for this case."),
  beforeLoad: requirePermission("fieldVisit.access"),
  component: Page,
});

/** A single labelled read-only value for the submitted view. */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

/** The four-field entry form, shown only when no Field Visit exists yet. */
function FieldVisitForm({
  caseId,
  onSubmitted,
}: {
  caseId: string;
  onSubmitted: (visit: FieldVisit) => void;
}) {
  const form = useForm<FieldVisitFormValues>({
    resolver: zodResolver(fieldVisitFormSchema),
    defaultValues: {
      floor: "",
      building: "",
      ageOfBuilding: "",
      sqFeet: "",
    },
  });

  const submit = useMutation({
    mutationFn: async (values: FieldVisitFormValues) => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_submitFieldVisit(token, caseId, values);
    },
    onSuccess: (visit) => {
      toast.success("Field visit submitted");
      onSubmitted(visit);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to submit field visit");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Field Visit Form
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => submit.mutate(values))}
            className="flex flex-col"
          >
            <div className="grid grid-cols-1 gap-6 px-6 pb-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <Input {...field} placeholder="e.g. 3rd floor" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <Input {...field} placeholder="e.g. Block A" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ageOfBuilding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age of Building</FormLabel>
                    <Input {...field} placeholder="e.g. 12 years" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sqFeet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sq. Feet</FormLabel>
                    <Input {...field} placeholder="e.g. 1450" />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormActions submitText="Submit Field Visit" isSubmitting={submit.isPending} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/** Read-only view once a Field Visit has been submitted. */
function SubmittedFieldVisit({ visit }: { visit: FieldVisit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Field Visit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm">
            Submitted
            {visit.submittedAt ? ` on ${new Date(visit.submittedAt).toLocaleString()}` : ""}. This
            field visit is read-only.
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Floor" value={visit.floor} />
          <ReadOnlyField label="Building" value={visit.building} />
          <ReadOnlyField label="Age of Building" value={visit.ageOfBuilding} />
          <ReadOnlyField label="Sq. Feet" value={visit.sqFeet} />
        </div>
      </CardContent>
    </Card>
  );
}

function Page() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();

  // Site Engineers cannot view the admin-only /cases list; point them at their
  // own "My Cases" instead so the breadcrumb doesn't lead to a 403.
  const currentUser = useCurrentUser();
  const listsAllCases = can(currentUser?.role, "cases.view");
  const backTo = listsAllCases ? "/cases" : "/my-cases";
  const backLabel = listsAllCases ? "Cases" : "My Cases";

  const {
    data: fieldVisit,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["field-visit", caseId],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      // Server resolves undefined -> null so react-query treats it as loaded.
      const visit = await api_getMyFieldVisit(token, caseId);
      return visit ?? null;
    },
    enabled: !!caseId,
  });

  const header = (
    <PageHeader
      title="Field Visit"
      description="Site inspection details for this case."
      crumbs={[
        { label: backLabel, link: { to: backTo } },
        { label: caseId, link: { to: "/cases/$caseId", params: { caseId } } },
        { label: "Field Visit" },
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
            <Button asChild variant="outline" className="mt-4">
              <Link to="/cases/$caseId" params={{ caseId }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Case
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Visit"
        description="Site inspection details for this case."
        crumbs={[
          { label: backLabel, link: { to: backTo } },
          { label: caseId, link: { to: "/cases/$caseId", params: { caseId } } },
          { label: "Field Visit" },
        ]}
        actions={
          <>
            {fieldVisit?.status === "SUBMITTED" && <Badge variant="secondary">Submitted</Badge>}
            <Button asChild variant="outline">
              <Link to="/cases/$caseId" params={{ caseId }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Case
              </Link>
            </Button>
          </>
        }
      />

      {fieldVisit ? (
        <SubmittedFieldVisit visit={fieldVisit} />
      ) : (
        <FieldVisitForm
          caseId={caseId}
          onSubmitted={(visit) => {
            // Reflect the new submission immediately and refresh case state.
            queryClient.setQueryData(["field-visit", caseId], visit);
            queryClient.invalidateQueries({ queryKey: ["field-visit", caseId] });
            queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
            queryClient.invalidateQueries({ queryKey: ["my-cases"] });
          }}
        />
      )}
    </div>
  );
}
