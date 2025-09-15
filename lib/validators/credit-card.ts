import { z } from 'zod';

export const cardTransactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  balance: z.number().min(0, "Balance must be positive"),
  usedBalance: z.number().min(0, "Used balance must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
  emiDate: z.string().min(1, "EMI date is required"),
  charges: z.number().min(0, "Charges must be positive"),
  note: z.string().optional(),
  transactionType: z.enum(['CREDIT', 'DEBIT', 'ADJUSTMENT']).default('CREDIT'),
}).refine((data) => {
  return data.usedBalance <= data.balance;
}, {
  message: "Used balance cannot exceed available balance",
  path: ["usedBalance"]
});

export type CardTransactionInput = z.infer<typeof cardTransactionSchema>;

export const cardHolderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cardNumber: z.string().min(1, "Card number is required")
});

export type CardHolderInput = z.infer<typeof cardHolderSchema>;
