import { z } from "zod";

const deliveryChallanItemSchema = z.object({
  particulars: z.string().min(1, "Particulars are required"),
  pktNo: z.string().min(1, "Packet number is required"),
  shape: z.string().min(1, "Shape is required"),
  colorClarity: z.string().min(1, "Color/clarity is required"),
  pcs: z.coerce.number().int().nonnegative(),
  cts: z.coerce.number().nonnegative(),
  pricePerCarat: z.coerce.number().nonnegative(),
  pt: z.coerce.number().optional().nullable(),
});

export const deliveryChallanFormSchema = z.object({
  partyName: z.string().min(1, "Party name is required"),
  date: z.coerce.date(),
  items: z.array(deliveryChallanItemSchema).min(1, "At least one item is required"),
});

export type DeliveryChallanFormValues = z.infer<typeof deliveryChallanFormSchema>;
