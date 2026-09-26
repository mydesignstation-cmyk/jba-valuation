import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

export const createBankSchema = z.object({
  name: z
    .string()
    .min(1, "Bank name is required")
    .trim()
    .max(255, "Bank name must be 255 characters or less"),
});

export const updateBankSchema = z.object({
  name: z
    .string()
    .min(1, "Bank name is required")
    .trim()
    .max(255, "Bank name must be 255 characters or less"),
});

export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;
