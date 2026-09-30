import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

// Phone number validation: 10 digits maximum, basic international format support
const phoneSchema = z.string().min(1, "Phone number is required").regex(/^[+]?[(]?[0-9]{2,3}[)]?[-\s.]?[0-9]{3,4}[-\s.]?[0-9]{4}$/, "Phone number must be 10 digits or less (format: 555-123-4567 or +1 555 123 4567)");

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
