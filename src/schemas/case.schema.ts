import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

export const roleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "SITE_ENGINEER",
  "MAKER",
  "CHECKER",
  "UPLOADER",
]);

export const caseStageSchema = z.enum([
  "CREATED",
  "ASSIGNED",
  "FIELD_VISIT_PENDING",
  "FIELD_VISIT_SUBMITTED",
  "MAKER_PENDING",
  "MAKER_COMPLETED",
  "CHECKER_PENDING",
  "CHECKER_COMPLETED",
  "UPLOADER_PENDING",
  "COMPLETED",
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
