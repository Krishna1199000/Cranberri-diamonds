"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const paymentFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amountINR: z.string().optional(),
  amountUSD: z.string().optional(),
  mode: z.string().min(1, 'Payment mode is required'),
  note: z.string().optional(),
})
  .refine((data) => Boolean(data.amountINR) || Boolean(data.amountUSD), {
    message: 'Enter Amount (INR) or Amount (USD)'
  })
  .refine((data) => !(data.amountINR && data.amountUSD), {
    message: 'Enter only INR or only USD, not both'
  });

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface Payment {
  id: string;
  date: string;
  amountINR: number;
  mode: string;
  note?: string;
}

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  payment?: Payment | null;
  onSuccess: () => void;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  vendorId,
  payment,
  onSuccess,
}: PaymentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockedCurrency, setLockedCurrency] = useState<'INR' | 'USD' | null>(null);
  const isEditing = !!payment;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      date: '',
      amountINR: '',
      amountUSD: '',
      mode: '',
      note: '',
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        date: new Date(payment.date).toISOString().split('T')[0],
        amountINR: String(payment.amountINR ?? ''),
        amountUSD: '',
        mode: payment.mode,
        note: payment.note || '',
      });
      setLockedCurrency('INR');
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amountINR: '',
        amountUSD: '',
        mode: '',
        note: '',
      });
      setLockedCurrency(null);
    }
  }, [payment, form]);

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEditing 
        ? `/api/vendors/${vendorId}/payments/${payment.id}` 
        : `/api/vendors/${vendorId}/payments`;
      const method = isEditing ? 'PUT' : 'POST';
      const amountInrNum = data.amountINR ? parseFloat(data.amountINR) : undefined;
      const amountUsdNum = data.amountUSD ? parseFloat(data.amountUSD) : undefined;
      if (!amountInrNum && !amountUsdNum) {
        toast.error('Enter Amount (INR) or Amount (USD)');
        setIsSubmitting(false);
        return;
      }
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: data.date,
          mode: data.mode,
          note: data.note,
          amountINR: amountInrNum,
          amountUSD: amountUsdNum,
        }),
      });

      if (response.ok) {
        toast.success(`Payment ${isEditing ? 'updated' : 'recorded'} successfully`);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'record'} payment`);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error(`Error ${isEditing ? 'updating' : 'recording'} payment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            {isEditing ? 'Edit Payment' : 'Record New Payment'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing
              ? 'Update the payment information below.'
              : 'Enter the payment information below to record a new payment.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Date *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountINR"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Amount (INR) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Enter amount in INR"
                      disabled={lockedCurrency === 'USD'}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value?.trim();
                        if (val) {
                          setLockedCurrency('INR');
                        } else if (!form.getValues('amountUSD')) {
                          setLockedCurrency(null);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Enter amount in USD"
                      disabled={lockedCurrency === 'INR'}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value?.trim();
                        if (val) {
                          setLockedCurrency('USD');
                        } else if (!form.getValues('amountINR')) {
                          setLockedCurrency(null);
                        }
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">If USD is entered, it will be converted to INR using the latest rate on save.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Payment Mode *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="e.g., Bank Transfer, Cash, Cheque, UPI"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Enter any additional notes (optional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Payment' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
