import { z } from "zod";

export const diamondItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  carat: z.coerce.number().min(0.01, "Carat must be greater than 0"),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  shape: z.string().optional(),
  lab: z.string().min(1, "Lab is required"),
  reportNo: z.string().min(1, "Report number is required"),
  stockId: z.string().optional(), // Stock ID field
  pricePerCarat: z.coerce.number().min(0.01, "Price per carat must be greater than 0"),
  /** Internal negotiation price — validated against tiers; not shown on client documents. */
  enteredPricePerCarat: z.coerce.number().min(0.01).optional(),
});

export type DiamondItem = z.infer<typeof diamondItemSchema>;

export const invoiceFormSchema = z.object({
  invoiceNo: z.string().optional(),
  date: z.coerce.date({ errorMap: () => ({ message: 'Invalid date format' }) }),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'Invalid due date format' }) }),
  paymentTerms: z.coerce.number().min(1, "Payment terms are required"),
  shipmentId: z.string().min(1, "Company selection is required"),
  description: z.string().optional(),
  shipmentCost: z.number(), // Make required
  discount: z.number(),     // Make required
  crPayment: z.number(),    // Make required
  emailEnabled: z.boolean(), // Email toggle
  items: z.array(diamondItemSchema).min(1, "At least one item is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

