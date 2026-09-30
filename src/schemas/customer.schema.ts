import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

// Phone number validation: exactly 10 digits with flexible formatting
const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/, "Phone number must be exactly 10 digits (e.g., 555-123-4567)")
  .refine(
    (val) => {
      // Extract only digits to count
      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length === 10;
    },
    "Phone number must contain exactly 10 digits"
  );

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
