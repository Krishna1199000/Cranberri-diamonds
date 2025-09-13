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

const vendorFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  address: z.string().min(1, 'Address is required'),
  gstNumber: z.string().optional(),
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  location: z.string().min(1, 'Location is required'),
  businessType: z.string().min(1, 'Business type is required'),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  address: string;
  gstNumber?: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  location: string;
  businessType: string;
}

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSuccess: () => void;
}

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: VendorFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!vendor;

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      companyName: '',
      ownerName: '',
      contactNumber: '',
      address: '',
      gstNumber: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: '',
      location: '',
      businessType: '',
    },
  });

  useEffect(() => {
    if (vendor) {
      form.reset({
        companyName: vendor.companyName,
        ownerName: vendor.ownerName,
        contactNumber: vendor.contactNumber,
        address: vendor.address,
        gstNumber: vendor.gstNumber || '',
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
        bankName: vendor.bankName,
        accountHolderName: vendor.accountHolderName,
        location: vendor.location,
        businessType: vendor.businessType,
      });
    } else {
      form.reset({
        companyName: '',
        ownerName: '',
        contactNumber: '',
        address: '',
        gstNumber: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: '',
        location: '',
        businessType: '',
      });
    }
  }, [vendor, form]);

  const onSubmit = async (data: VendorFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/vendors/${vendor.id}` : '/api/vendors';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          gstNumber: data.gstNumber || '', // Ensure optional fields are never undefined
        }),
        credentials: 'include', // Important: Include cookies for session
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(`Vendor ${isEditing ? 'updated' : 'created'} successfully`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(responseData.error || `Failed to ${isEditing ? 'update' : 'create'} vendor`);
      }
    } catch (error) {
      console.error('Error submitting vendor:', error);
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} vendor`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing
              ? 'Update the vendor information below.'
              : 'Enter the vendor information below to add a new vendor.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter company name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Owner Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter owner name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter contact number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Business Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter business type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">GST Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Enter GST number (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Enter complete address"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-black mb-3">Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Account Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="border-gray-300 focus:border-black focus:ring-black"
                          placeholder="Enter account number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">IFSC Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="border-gray-300 focus:border-black focus:ring-black"
                          placeholder="Enter IFSC code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Bank Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="border-gray-300 focus:border-black focus:ring-black"
                          placeholder="Enter bank name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Account Holder Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="border-gray-300 focus:border-black focus:ring-black"
                          placeholder="Enter account holder name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}