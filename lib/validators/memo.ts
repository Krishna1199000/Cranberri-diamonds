import { z } from "zod";

// Define the schema for an individual memo item
const memoItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  carat: z.number().min(0.01, "Carat must be at least 0.01"),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  lab: z.string().min(1, "Lab is required"),
  reportNo: z.string().min(1, "Report number is required"),
  pricePerCarat: z.number().min(0.01, "Price per carat must be at least 0.01"),
  total: z.number().optional(),
});

// Define the schema for the entire memo form
export const memoFormSchema = z.object({
  memoNo: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  paymentTerms: z.number().min(1, "Payment terms must be at least 1 day"),
  shipmentId: z.string().min(1, "Company is required"),
  shipmentCost: z.number(),
  discount: z.number(),
  crPayment: z.number(),
  description: z.string().optional(),
  items: z.array(memoItemSchema).min(1, "At least one item is required"),
});

// Export the types derived from the schema
export type MemoItem = z.infer<typeof memoItemSchema>;
export type MemoFormValues = z.infer<typeof memoFormSchema>;