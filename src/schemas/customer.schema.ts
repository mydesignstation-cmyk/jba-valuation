import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

// Phone number validation: exactly 10 digits, no formatting
const phoneSchema = z
  .string()
  .min(10, "Phone number must be exactly 10 digits")
  .max(10, "Phone number must be exactly 10 digits")
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits with no spaces or special characters");

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  alternativeContactPersonName: z.string().optional().or(z.literal("")),
  alternativePhoneNumber: z.string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.replace(/\D/g, "").length === 10,
      "Phone number must be exactly 10 digits"
    ),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  alternativeContactPersonName: z.string().optional().or(z.literal("")),
  alternativePhoneNumber: z.string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.replace(/\D/g, "").length === 10,
      "Phone number must be exactly 10 digits"
    ),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
