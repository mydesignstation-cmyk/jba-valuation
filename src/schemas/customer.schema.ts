import { z } from "zod";

/** Zod schemas for form validation and data parsing. */

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
