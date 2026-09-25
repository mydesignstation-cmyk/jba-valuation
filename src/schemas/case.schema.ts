import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

export const caseStageSchema = z.enum([
  "created",
  "engineer_assigned",
  "field_visit_submitted",
  "maker_completed",
  "checker_completed",
  "uploaded",
]);

export const createCaseSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
});

export const assignEngineerSchema = z.object({
  caseId: z.string().min(1),
  engineerId: z.string().min(1, "Select a site engineer"),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type AssignEngineerInput = z.infer<typeof assignEngineerSchema>;
