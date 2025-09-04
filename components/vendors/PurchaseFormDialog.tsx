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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const purchaseFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  mobileNumber: z.string().min(1, 'Mobile number is required'),
  shape: z.string().min(1, 'Shape is required'),
  color: z.string().min(1, 'Color is required'),
  clarity: z.string().min(1, 'Clarity is required'),
  lab: z.string().min(1, 'Lab is required'),
  certificate: z.string().min(1, 'Certificate is required'),
  pricePerCaratUSD: z.string().min(1, 'Required'),
  totalPriceUSD: z.string().min(1, 'Required'),
  gstPercentage: z.string().min(1, 'GST percentage is required'),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface Purchase {
  id: string;
  date: string;
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  shape: string;
  color: string;
  clarity: string;
  lab: string;
  certificate: string;
  pricePerCaratUSD: number;
  totalPriceUSD: number;
  gstPercentage?: number;
  gstAmountUSD?: number;
  finalPriceUSD?: number;
  usdInrRate: number;
  inrPrice: number;
}

interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  purchase?: Purchase | null;
  onSuccess: () => void;
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  vendorId,
  purchase,
  onSuccess,
}: PurchaseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedGST, setCalculatedGST] = useState<number>(0);
  const [calculatedFinalPrice, setCalculatedFinalPrice] = useState<number>(0);
  const isEditing = !!purchase;

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      date: '',
      companyName: '',
      contactPerson: '',
      mobileNumber: '',
      shape: '',
      color: '',
      clarity: '',
      lab: '',
      certificate: '',
      pricePerCaratUSD: '',
      totalPriceUSD: '',
      gstPercentage: '18', // Default GST percentage
    },
  });

  // Watch for changes in totalPriceUSD and gstPercentage to calculate GST and final price
  const watchedTotalPrice = form.watch('totalPriceUSD');
  const watchedGSTPercentage = form.watch('gstPercentage');

  useEffect(() => {
    const totalPrice = parseFloat(watchedTotalPrice) || 0;
    const gstPercentage = parseFloat(watchedGSTPercentage) || 0;
    
    if (totalPrice > 0 && gstPercentage >= 0) {
      const gstAmount = (totalPrice * gstPercentage) / 100;
      const finalPrice = totalPrice + gstAmount;
      
      setCalculatedGST(gstAmount);
      setCalculatedFinalPrice(finalPrice);
    } else {
      setCalculatedGST(0);
      setCalculatedFinalPrice(totalPrice);
    }
  }, [watchedTotalPrice, watchedGSTPercentage]);

  useEffect(() => {
    if (purchase) {
      form.reset({
        date: new Date(purchase.date).toISOString().split('T')[0],
        companyName: purchase.companyName,
        contactPerson: purchase.contactPerson,
        mobileNumber: purchase.mobileNumber,
        shape: purchase.shape,
        color: purchase.color,
        clarity: purchase.clarity,
        lab: purchase.lab,
        certificate: purchase.certificate,
        pricePerCaratUSD: String(purchase.pricePerCaratUSD ?? ''),
        totalPriceUSD: String(purchase.totalPriceUSD ?? ''),
        gstPercentage: String(purchase.gstPercentage ?? '18'),
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        companyName: '',
        contactPerson: '',
        mobileNumber: '',
        shape: '',
        color: '',
        clarity: '',
        lab: '',
        certificate: '',
        pricePerCaratUSD: '',
        totalPriceUSD: '',
        gstPercentage: '18',
      });
    }
  }, [purchase, form]);

  const onSubmit = async (data: PurchaseFormData) => {
    setIsSubmitting(true);
    try {
      const pricePerCaratUSDNum = parseFloat(data.pricePerCaratUSD);
      const totalPriceUSDNum = parseFloat(data.totalPriceUSD);
      const gstPercentageNum = parseFloat(data.gstPercentage);
      
      if (!isFinite(pricePerCaratUSDNum) || pricePerCaratUSDNum <= 0) {
        toast.error('Enter a valid Price per Carat (USD)');
        setIsSubmitting(false);
        return;
      }
      if (!isFinite(totalPriceUSDNum) || totalPriceUSDNum <= 0) {
        toast.error('Enter a valid Total Price (USD)');
        setIsSubmitting(false);
        return;
      }
      if (!isFinite(gstPercentageNum) || gstPercentageNum < 0) {
        toast.error('Enter a valid GST percentage');
        setIsSubmitting(false);
        return;
      }

      const url = isEditing 
        ? `/api/vendors/${vendorId}/purchases/${purchase.id}` 
        : `/api/vendors/${vendorId}/purchases`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          pricePerCaratUSD: pricePerCaratUSDNum,
          totalPriceUSD: totalPriceUSDNum,
          gstPercentage: gstPercentageNum,
          gstAmountUSD: calculatedGST,
          finalPriceUSD: calculatedFinalPrice,
        }),
      });

      if (response.ok) {
        toast.success(`Purchase ${isEditing ? 'updated' : 'created'} successfully`);
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} purchase`);
      }
    } catch (error) {
      console.error('Error submitting purchase:', error);
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} purchase`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            {isEditing ? 'Edit Purchase' : 'Add New Purchase'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing
              ? 'Update the purchase information below.'
              : 'Enter the purchase information below to add a new purchase.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Seller Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter seller company name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Contact Person *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter contact person name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Mobile Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter mobile number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shape"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Shape *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="e.g., Round, Princess, Oval"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Color *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="e.g., D, E, F, G"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Clarity *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="e.g., IF, VVS1, VVS2, VS1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lab"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Lab *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="e.g., GIA, IGI, GCAL"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Certificate Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter certificate number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerCaratUSD"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Price per Carat (USD) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter price per carat"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalPriceUSD"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Total Price (USD) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter total price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">GST Percentage (%) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="e.g., 18 for 18%"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* GST Calculation Display */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-black">GST Calculation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price (USD):</span>
                  <span className="font-medium text-black">
                    ${parseFloat(watchedTotalPrice) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Amount (USD):</span>
                  <span className="font-medium text-black">
                    ${calculatedGST.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Price (USD):</span>
                  <span className="font-medium text-black">
                    ${calculatedFinalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">
                <strong>Note:</strong> The USD to INR conversion rate will be fetched automatically 
                and the INR price will be calculated when you save this purchase. GST is calculated 
                on the base price and added to get the final purchase amount.
              </p>
            </div>

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
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Purchase' : 'Add Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
