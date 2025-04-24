import { z } from "zod";

export const diamondItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  carat: z.coerce.number().min(0.01, "Carat must be greater than 0"),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  lab: z.string().min(1, "Lab is required"),
  reportNo: z.string().min(1, "Report number is required"),
  pricePerCarat: z.coerce.number().min(0.01, "Price per carat must be greater than 0"),
});

export type DiamondItem = z.infer<typeof diamondItemSchema>;

export const invoiceFormSchema = z.object({
  invoiceNo: z.string().optional(),
  date: z.date(),
  dueDate: z.date(),
  paymentTerms: z.coerce.number().min(1, "Payment terms are required"),
  companyName: z.string().min(1, "Company name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  description: z.string().optional(),
  items: z.array(diamondItemSchema).min(1, "At least one item is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;