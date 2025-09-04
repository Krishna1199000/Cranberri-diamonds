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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ledgerFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['CREDIT', 'DEBIT'], { required_error: 'Type is required' }),
  amountINR: z.string().min(1, 'Amount is required'),
  reason: z.string().min(1, 'Reason is required'),
  counterparty: z.string().optional(),
});

type LedgerFormData = z.infer<typeof ledgerFormSchema>;

interface LedgerEntry {
  id: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  amountINR: number;
  reason: string;
  counterparty: string | null;
}

interface LedgerEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: LedgerEntry | null;
  onSuccess: () => void;
}

export function LedgerEntryFormDialog({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: LedgerEntryFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!entry;

  const form = useForm<LedgerFormData>({
    resolver: zodResolver(ledgerFormSchema),
    defaultValues: {
      date: '',
      type: 'CREDIT',
      amountINR: '',
      reason: '',
      counterparty: '',
    },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        date: new Date(entry.date).toISOString().split('T')[0],
        type: entry.type,
        amountINR: String(entry.amountINR),
        reason: entry.reason,
        counterparty: entry.counterparty || '',
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        type: 'CREDIT',
        amountINR: '',
        reason: '',
        counterparty: '',
      });
    }
  }, [entry, form]);

  const onSubmit = async (data: LedgerFormData) => {
    setIsSubmitting(true);
    try {
      const amountNum = parseFloat(data.amountINR);

      if (!isFinite(amountNum) || amountNum <= 0) {
        toast.error('Enter a valid amount');
        setIsSubmitting(false);
        return;
      }

      const url = isEditing ? `/api/finance/ledger/${entry.id}` : '/api/finance/ledger';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: data.date,
          type: data.type,
          amountINR: amountNum,
          reason: data.reason,
          counterparty: data.counterparty || null,
        }),
      });

      if (response.ok) {
        toast.success(`Entry ${isEditing ? 'updated' : 'created'} successfully`);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} entry`);
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} entry`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            {isEditing ? 'Edit Ledger Entry' : 'Add New Entry'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing
              ? 'Update the ledger entry information below.'
              : 'Enter the ledger entry information below.'}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue placeholder="Select entry type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="CREDIT">Credit</SelectItem>
                      <SelectItem value="DEBIT">Debit</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Enter amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Enter reason for this entry"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="counterparty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Counterparty</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Enter counterparty (optional)"
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
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Entry' : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


