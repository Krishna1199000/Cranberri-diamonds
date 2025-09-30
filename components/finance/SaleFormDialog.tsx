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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const saleFormSchema = z.object({
  // Sale Information
  date: z.string().optional(),
  companyName: z.string().optional(),
  ownerName: z.string().optional(),
  
  // Vendor Information
  vendorCompany: z.string().optional(),
  
  // Diamond Details
  shape: z.string().optional(),
  carat: z.string().optional(),
  color: z.string().optional(),
  clarity: z.string().optional(),
  lab: z.string().optional(),
  certificateNumber: z.string().optional(),
  pricePerCaratSold: z.string().optional(),
  totalPriceSoldINR: z.string().optional(),
  pricePerCaratPurchase: z.string().optional(),
  totalPricePurchasedINR: z.string().optional(),
  invoiceAmount: z.string().optional(),
  
  // Additional Costs
  shippingCharge: z.string().optional(),
  employeeProfitPercent: z.string().optional(),
  gstPercentage: z.string().optional(),
  dueDate: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface VendorPurchase {
  id: string;
  certificate: string;
  companyName: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  pricePerCaratUSD: number;
  totalPriceUSD: number;
  usdInrRate: number;
  inrPrice: number;
}

interface Sale {
  id: string;
  date: string;
  companyName: string;
  ownerName: string;
  vendorCompany: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  certificateNumber: string;
  totalPriceSoldINR: number;
  totalPricePurchasedINR: number;
  gstPercentage?: number;
  gstAmountINR?: number;
  finalSalePriceINR?: number;
  shippingCharge: number;
  employeeProfitPercent: number;
  finalProfit: number;
  dueDate: string;
}

interface SaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale | null;
  onSuccess: () => void;
}

export function SaleFormDialog({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: SaleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorPurchases, setVendorPurchases] = useState<VendorPurchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [companies, setCompanies] = useState<Array<{id: string, companyName: string, ownerName: string}>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [diamondItems, setDiamondItems] = useState<Array<{
    id: string;
    shape: string;
    carat: number;
    color: string;
    clarity: string;
    lab: string;
    certificateNumber: string;
    pricePerCaratSold: number;
    totalPriceSoldINR: number;
    pricePerCaratPurchase: number;
    totalPricePurchasedINR: number;
  }>>([{
    id: '1',
    shape: '',
    carat: 0,
    color: '',
    clarity: '',
    lab: '',
    certificateNumber: '',
    pricePerCaratSold: 0,
    totalPriceSoldINR: 0,
    pricePerCaratPurchase: 0,
    totalPricePurchasedINR: 0,
  }]);

  const [calculatedProfit, setCalculatedProfit] = useState<number>(0);
  const [finalCalculatedProfit, setFinalCalculatedProfit] = useState<number>(0);
  const isEditing = !!sale;

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyName: '',
      ownerName: '',
      vendorCompany: '',
      shape: '',
      carat: '',
      color: '',
      clarity: '',
      lab: '',
      certificateNumber: '',
      pricePerCaratSold: '',
      totalPriceSoldINR: '',
      pricePerCaratPurchase: '',
      totalPricePurchasedINR: '',
      invoiceAmount: '',
      shippingCharge: '',
      employeeProfitPercent: '',
      gstPercentage: '18',
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch vendor purchases and companies on component mount
  useEffect(() => {
    if (open) {
      fetchVendorPurchases();
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched companies:', data);
        // Handle both array format and object with companies property
        if (Array.isArray(data)) {
          setCompanies(data);
        } else if (data.companies && Array.isArray(data.companies)) {
          setCompanies(data.companies);
        } else {
          setCompanies([]);
        }
      } else {
        console.error('Failed to fetch companies:', response.status);
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === 'manual') return;
    
    const selectedCompany = companies.find(c => c.id === companyId);
    if (selectedCompany) {
      form.setValue('companyName', selectedCompany.companyName || '');
      form.setValue('ownerName', selectedCompany.ownerName || '');
      console.log('Selected company:', selectedCompany);
    }
  };

  const addDiamondItem = () => {
    const newItem = {
      id: Date.now().toString(),
      shape: '',
      carat: 0,
      color: '',
      clarity: '',
      lab: '',
      certificateNumber: '',
      pricePerCaratSold: 0,
      totalPriceSoldINR: 0,
      pricePerCaratPurchase: 0,
      totalPricePurchasedINR: 0,
    };
    setDiamondItems([...diamondItems, newItem]);
  };

  const removeDiamondItem = (itemId: string) => {
    if (diamondItems.length > 1) {
      setDiamondItems(diamondItems.filter(item => item.id !== itemId));
    }
  };

  const updateDiamondItem = (itemId: string, field: string, value: string | number) => {
    setDiamondItems(diamondItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Update form when sale is provided (editing mode)
  useEffect(() => {
    if (sale && isEditing) {
      form.reset({
        date: new Date(sale.date).toISOString().split('T')[0],
        companyName: sale.companyName,
        ownerName: sale.ownerName,
        vendorCompany: sale.vendorCompany,
        shape: sale.shape,
        carat: String(sale.carat),
        color: sale.color,
        clarity: sale.clarity,
        lab: sale.lab,
        certificateNumber: sale.certificateNumber,
        totalPriceSoldINR: String(sale.totalPriceSoldINR),
        totalPricePurchasedINR: String(sale.totalPricePurchasedINR),
        shippingCharge: String(sale.shippingCharge),
        employeeProfitPercent: String(sale.employeeProfitPercent),
        gstPercentage: String(sale.gstPercentage || '18'),
        dueDate: new Date(sale.dueDate).toISOString().split('T')[0],
      });
    }
  }, [sale, isEditing, form]);

  const fetchVendorPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const response = await fetch('/api/vendors/purchases');
      if (response.ok) {
        const data = await response.json();
        setVendorPurchases(data);
      }
    } catch (error) {
      console.error('Error fetching vendor purchases:', error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleCertificateSelect = (certificateId: string) => {
    if (certificateId === 'manual') return;
    
    const purchase = vendorPurchases.find(p => p.id === certificateId);
    if (purchase) {
      // Update the first diamond item with the selected certificate data
      const updatedItems = [...diamondItems];
      updatedItems[0] = {
        ...updatedItems[0],
        shape: purchase.shape,
        carat: purchase.carat,
        color: purchase.color,
        clarity: purchase.clarity,
        lab: purchase.lab,
        certificateNumber: purchase.certificate,
        pricePerCaratPurchase: purchase.pricePerCaratUSD,
        totalPricePurchasedINR: purchase.inrPrice,
      };
      setDiamondItems(updatedItems);
      
      // Also set vendor company in the form
      form.setValue('vendorCompany', purchase.companyName);
    }
  };

  // Calculate profit whenever relevant fields change
  useEffect(() => {
    const subscription = form.watch((value) => {
      const totalSold = parseFloat(value.totalPriceSoldINR || '0');
      const totalPurchased = parseFloat(value.totalPricePurchasedINR || '0');
      const shipping = parseFloat(value.shippingCharge || '0');
      const employeeProfitPercent = parseFloat(value.employeeProfitPercent || '0');
      const gstPercentage = parseFloat(value.gstPercentage || '0');
      
      // Basic profit calculation
      const basicProfit = totalSold - totalPurchased;
      setCalculatedProfit(basicProfit);
      
      // Calculate employee profit in INR from percentage
      const employeeProfitINR = (totalSold * employeeProfitPercent) / 100;
      
      // Calculate GST in INR
      const gstInr = (totalSold * gstPercentage) / 100;
      
      // Final profit calculation (after deducting employee profit, shipping, and GST)
      const finalProfit = totalSold - totalPurchased - employeeProfitINR - shipping - gstInr;
      setFinalCalculatedProfit(finalProfit);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: SaleFormData) => {
    setIsSubmitting(true);
    try {
      // Convert string values to numbers
      const formattedData = {
        ...data,
        carat: parseFloat(data.carat || '0'),
        totalPriceSoldINR: parseFloat(data.totalPriceSoldINR || '0'),
        totalPricePurchasedINR: parseFloat(data.totalPricePurchasedINR || '0'),
        shippingCharge: parseFloat(data.shippingCharge || '0'),
        employeeProfitPercent: parseFloat(data.employeeProfitPercent || '0'),
        gstPercentage: parseFloat(data.gstPercentage || '0'),
        finalProfit: finalCalculatedProfit,
      };

      const url = isEditing ? `/api/finance/enhanced-sales/${sale.id}` : '/api/finance/enhanced-sales';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        toast.success(`Sale ${isEditing ? 'updated' : 'created'} successfully`);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} sale`);
      }
    } catch (error) {
      console.error('Error submitting sale:', error);
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} sale`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">
            {isEditing ? 'Edit Sale' : 'Add New Sale'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing
              ? 'Update the sale information below.'
              : 'Enter comprehensive sale information below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Certificate Selection */}
            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Certificate Selection</CardTitle>
                  <CardDescription>Select a certificate from vendor purchases to auto-fill data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handleCertificateSelect} value="">
                    <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder={loadingPurchases ? "Loading certificates..." : "Select a certificate number"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Enter Manually</SelectItem>
                      {vendorPurchases.map((purchase) => (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          {purchase.certificate} - {purchase.companyName} ({purchase.shape}, {purchase.color}, {purchase.clarity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Company Selection */}
            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Selection</CardTitle>
                  <CardDescription>Select a customer from your master list to auto-fill company and owner details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handleCompanySelect} value="">
                    <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder={loadingCompanies ? "Loading customers..." : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="manual">Enter Manually</SelectItem>
                      {Array.isArray(companies) && companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.companyName} - {company.ownerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Basic Sale Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="border-gray-300 focus:border-black focus:ring-black" />
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
                      <FormLabel className="text-black">Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 focus:border-black focus:ring-black" placeholder="Customer company" />
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
                        <Input {...field} className="border-gray-300 focus:border-black focus:ring-black" placeholder="Owner name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Diamond Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Diamond Details</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-black text-black hover:bg-gray-100"
                    onClick={addDiamondItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vendor Company Field */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="vendorCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Vendor Company</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-gray-300 focus:border-black focus:ring-black" placeholder="Vendor company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {diamondItems.map((item, index) => (
                  <Card key={item.id} className="p-4 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-black">Diamond Item {index + 1}</h4>
                      {diamondItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDiamondItem(item.id)}
                          className="text-red-600 hover:bg-red-50 border-red-300"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <FormLabel className="text-black">Shape</FormLabel>
                        <Input 
                          value={item.shape}
                          onChange={(e) => updateDiamondItem(item.id, 'shape', e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black" 
                          placeholder="Round, Princess, etc." 
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-black">Carat</FormLabel>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={item.carat || ''}
                          onChange={(e) => updateDiamondItem(item.id, 'carat', parseFloat(e.target.value) || 0)}
                          className="border-gray-300 focus:border-black focus:ring-black" 
                          placeholder="1.00" 
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-black">Color</FormLabel>
                        <Input 
                          value={item.color}
                          onChange={(e) => updateDiamondItem(item.id, 'color', e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black" 
                          placeholder="D, E, F, etc." 
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-black">Clarity</FormLabel>
                        <Input 
                          value={item.clarity}
                          onChange={(e) => updateDiamondItem(item.id, 'clarity', e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black" 
                          placeholder="VVS1, VS1, etc." 
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-black">Lab</FormLabel>
                        <Input 
                          value={item.lab}
                          onChange={(e) => updateDiamondItem(item.id, 'lab', e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black" 
                          placeholder="GIA, IGI, etc." 
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-black">Certificate Number</FormLabel>
                        <Input 
                          value={item.certificateNumber}
                          onChange={(e) => updateDiamondItem(item.id, 'certificateNumber', e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black" 
                          placeholder="Certificate number" 
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <FormField
                control={form.control}
                  name="totalPriceSoldINR"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-black">Total Price Sold (INR)</FormLabel>
                    <FormControl>
                        <Input {...field} type="number" step="0.01" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                  name="totalPricePurchasedINR"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-black">Total Price Purchased (INR)</FormLabel>
                    <FormControl>
                        <Input {...field} type="number" step="0.01" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                  name="shippingCharge"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-black">Shipping Charge</FormLabel>
                    <FormControl>
                        <Input {...field} type="number" step="0.01" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                            <FormField
                control={form.control}
                name="employeeProfitPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Employee Profit %</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
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
                    <FormLabel className="text-black">GST Percentage (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" className="border-gray-300 focus:border-black focus:ring-black" placeholder="18.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Due Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="border-gray-300 focus:border-black focus:ring-black" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            {/* Profit Calculation Display */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Profit Calculation</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                  <p className={`text-xl font-bold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{calculatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">Total Sold - Total Purchased</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">GST Amount (INR)</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{((parseFloat(form.getValues('totalPriceSoldINR') || '0') * parseFloat(form.getValues('gstPercentage') || '0')) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">Calculated from percentage</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Employee Profit (INR)</p>
                  <p className="text-xl font-bold text-orange-600">
                    ₹{((parseFloat(form.getValues('totalPriceSoldINR') || '0') * parseFloat(form.getValues('employeeProfitPercent') || '0')) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">Calculated from percentage</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Final Profit</p>
                  <p className={`text-xl font-bold ${finalCalculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{finalCalculatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">After GST, Employee Profit & Shipping</p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Sale' : 'Add Sale'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
