import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

export const createBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .trim()
    .max(255, "Branch name must be 255 characters or less"),
});

export const updateBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .trim()
    .max(255, "Branch name must be 255 characters or less"),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
