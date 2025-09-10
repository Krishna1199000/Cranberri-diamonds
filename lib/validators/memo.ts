import { z } from "zod";

// Define the schema for an individual memo item
const memoItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  carat: z.coerce.number().min(0.01, "Carat must be greater than 0"),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  lab: z.string().min(1, "Lab is required"),
  reportNo: z.string().min(1, "Report number is required"),
  pricePerCarat: z.coerce.number().min(0.01, "Price per carat must be greater than 0"),
  total: z.number().optional(),
});

// Define the schema for the entire memo form
export const memoFormSchema = z.object({
  memoNo: z.string().optional(),
  date: z.coerce.date({ errorMap: () => ({ message: 'Invalid date format' }) }),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'Invalid due date format' }) }),
  paymentTerms: z.coerce.number().min(1, "Payment terms are required"),
  shipmentId: z.string().min(1, "Company selection is required"),
  description: z.string().optional(),
  shipmentCost: z.number(),
  discount: z.number(),
  crPayment: z.number(),
  items: z.array(memoItemSchema).min(1, "At least one item is required"),
});

// Export the types derived from the schema
export type MemoItem = z.infer<typeof memoItemSchema>;
export type MemoFormValues = z.infer<typeof memoFormSchema>;