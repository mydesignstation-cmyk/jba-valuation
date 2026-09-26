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
  customerId: z.string().min(1, "Customer is required"),
  requestNumber: z
    .string()
    .min(1, "Request number is required")
    .trim()
    .max(100, "Request number must be 100 characters or less"),
  bankId: z.string().min(1, "Bank is required"),
  branchId: z.string().min(1, "Branch is required"),
  assignedEngineerId: z.string().min(1, "Site engineer is required"),
});

export const updateCaseSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  requestNumber: z
    .string()
    .min(1, "Request number is required")
    .trim()
    .max(100, "Request number must be 100 characters or less"),
  bankId: z.string().min(1, "Bank is required"),
  branchId: z.string().min(1, "Branch is required"),
  assignedEngineerId: z.string().min(1, "Site engineer is required"),
});

export const assignEngineerSchema = z.object({
  caseId: z.string().min(1),
  engineerId: z.string().min(1, "Select a site engineer"),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type AssignEngineerInput = z.infer<typeof assignEngineerSchema>;
