import { z } from "zod";

export const createMakerValuationSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  dateOfValuation: z.string().min(1, "Date of Valuation is required"),
  dateOfInspection: z.string().min(1, "Date of Inspection is required"),
  refNo: z.string().min(1, "Ref. No. is required"),
  branch: z.string().min(1, "Branch is required"),
  bankName: z.string().min(1, "Bank Name is required"),
});

export type CreateMakerValuationInput = z.infer<typeof createMakerValuationSchema>;
