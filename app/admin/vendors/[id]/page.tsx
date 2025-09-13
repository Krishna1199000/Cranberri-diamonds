"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash, Building2, CreditCard, Package, Filter, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PurchaseFormDialog } from '@/components/vendors/PurchaseFormDialog';
import { PaymentFormDialog } from '@/components/vendors/PaymentFormDialog';
import { DeleteConfirmDialog } from '@/components/vendors/DeleteConfirmDialog';

interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  address: string;
  gstNumber: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  location: string;
  businessType: string;
  totalBusiness: number;
  balanceDue: number;
  purchases: Purchase[];
  payments: Payment[];
}

interface Purchase {
  id: string;
  date: string;
  dueDate: string | null;
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
  usdInrRate: number;
  inrPrice: number;
}

interface Payment {
  id: string;
  date: string;
  amountINR: number;
  mode: string;
  note: string;
}

export default function VendorDetailsPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Filter states
  const [purchaseDateFrom, setPurchaseDateFrom] = useState('');
  const [purchaseDateTo, setPurchaseDateTo] = useState('');
  const [paymentDateFrom, setPaymentDateFrom] = useState('');
  const [paymentDateTo, setPaymentDateTo] = useState('');
  
  // Delete states
  const [deletePurchase, setDeletePurchase] = useState<Purchase | null>(null);
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null);

  const fetchVendor = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (purchaseDateFrom) params.append('purchaseFrom', purchaseDateFrom);
      if (purchaseDateTo) params.append('purchaseTo', purchaseDateTo);
      if (paymentDateFrom) params.append('paymentFrom', paymentDateFrom);
      if (paymentDateTo) params.append('paymentTo', paymentDateTo);

      const response = await fetch(`/api/vendors/${vendorId}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVendor(data);
      } else {
        toast.error('Failed to fetch vendor details');
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error('Error fetching vendor details');
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, purchaseDateFrom, purchaseDateTo, paymentDateFrom, paymentDateTo]);

  useEffect(() => {
    if (vendorId) {
      fetchVendor();
    }
  }, [vendorId, fetchVendor]);

  const handleDeletePurchase = async (purchase: Purchase) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/purchases/${purchase.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Purchase deleted successfully');
        fetchVendor();
        // Dispatch custom event to refresh overview data in main vendors page
        window.dispatchEvent(new CustomEvent('vendorDataChanged', { 
          detail: { type: 'purchase', action: 'delete' } 
        }));
      } else {
        toast.error('Failed to delete purchase');
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Error deleting purchase');
    }
    setDeletePurchase(null);
  };

  const handleDeletePayment = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/payments/${payment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Payment deleted successfully');
        fetchVendor();
        // Dispatch custom event to refresh overview data in main vendors page
        window.dispatchEvent(new CustomEvent('vendorDataChanged', { 
          detail: { type: 'payment', action: 'delete' } 
        }));
      } else {
        toast.error('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Error deleting payment');
    }
    setDeletePayment(null);
  };

  const handleFormSuccess = () => {
    setIsPurchaseFormOpen(false);
    setIsPaymentFormOpen(false);
    setEditingPurchase(null);
    setEditingPayment(null);
    fetchVendor();
    // Dispatch custom event to refresh overview data in main vendors page
    window.dispatchEvent(new CustomEvent('vendorDataChanged', { 
      detail: { type: 'transaction', action: 'update' } 
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const isDueDatePassed = (dueDateString: string | null) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-3 text-gray-600">Loading vendor details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!vendor) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Vendor not found</h2>
          <p className="text-gray-600 mt-2">The vendor you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/admin/vendors">
            <Button className="mt-4 bg-black text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/vendors">
              <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-black">{vendor.companyName}</h1>
              <p className="text-gray-600">Vendor Details & Purchase Management</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Business</CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{formatCurrency(vendor.totalBusiness)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Balance Due</CardTitle>
              <CreditCard className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                vendor.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(vendor.balanceDue)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Purchases</CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{vendor.purchases.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="purchases" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Purchases ({vendor.purchases.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Payments ({vendor.payments.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-black">Vendor Information</CardTitle>
                <CardDescription>Complete vendor details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-black font-medium">{vendor.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Owner Name</label>
                    <p className="text-black font-medium">{vendor.ownerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Number</label>
                    <p className="text-black font-medium">{vendor.contactNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-black font-medium">{vendor.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Business Type</label>
                    <p className="text-black font-medium">{vendor.businessType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">GST Number</label>
                    <p className="text-black font-medium">{vendor.gstNumber || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-black font-medium">{vendor.address}</p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Number</label>
                      <p className="text-black font-medium">{vendor.accountNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                      <p className="text-black font-medium">{vendor.ifscCode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bank Name</label>
                      <p className="text-black font-medium">{vendor.bankName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Holder Name</label>
                      <p className="text-black font-medium">{vendor.accountHolderName}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-black">Diamond Purchases</h3>
                  <p className="text-gray-600">Manage purchase records for this vendor</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingPurchase(null);
                    setIsPurchaseFormOpen(true);
                  }}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Purchase
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="purchaseDateFrom" className="text-black">From Date</Label>
                      <Input
                        id="purchaseDateFrom"
                        type="date"
                        value={purchaseDateFrom}
                        onChange={(e) => setPurchaseDateFrom(e.target.value)}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchaseDateTo" className="text-black">To Date</Label>
                      <Input
                        id="purchaseDateTo"
                        type="date"
                        value={purchaseDateTo}
                        onChange={(e) => setPurchaseDateTo(e.target.value)}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="flex items-end space-x-2 md:col-span-2">
                      <Button
                        onClick={() => {
                          setIsLoading(true);
                          fetchVendor();
                        }}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button
                        onClick={() => {
                          setPurchaseDateFrom('');
                          setPurchaseDateTo('');
                          setIsLoading(true);
                          fetchVendor();
                        }}
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader className="bg-black">
                  <TableRow className="bg-black">
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Company</TableHead>
                    <TableHead className="text-white">Contact</TableHead>
                    <TableHead className="text-white">Diamond</TableHead>
                    <TableHead className="text-white">Lab</TableHead>
                    <TableHead className="text-white">Certificate</TableHead>
                    <TableHead className="text-white">Price (USD)</TableHead>
                    <TableHead className="text-white">Price (INR)</TableHead>
                    <TableHead className="text-white">Due Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendor.purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No purchases found. Add the first purchase to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendor.purchases.map((purchase) => {
                      const isOverdue = isDueDatePassed(purchase.dueDate);
                      return (
                      <TableRow key={purchase.id} className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}>
                        <TableCell className={`font-medium ${isOverdue ? "text-red-800" : "text-black"}`}>
                          {formatDate(purchase.date)}
                        </TableCell>
                        <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{purchase.companyName}</TableCell>
                        <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>
                          {purchase.contactPerson}<br />
                          <span className={`text-sm ${isOverdue ? "text-red-600" : "text-gray-500"}`}>{purchase.mobileNumber}</span>
                        </TableCell>
                        <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>
                          {purchase.shape} {purchase.color} {purchase.clarity}
                        </TableCell>
                        <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{purchase.lab}</TableCell>
                        <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{purchase.certificate}</TableCell>
                        <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>
                          {formatUSD(purchase.totalPriceUSD)}
                          <br />
                          <span className={`text-sm ${isOverdue ? "text-red-600" : "text-gray-500"}`}>
                            @{purchase.pricePerCaratUSD}/ct
                          </span>
                        </TableCell>
                        <TableCell className={`font-medium ${isOverdue ? "text-red-700" : "text-gray-700"}`}>
                          {formatCurrency(purchase.inrPrice)}
                          <br />
                          <span className={`text-sm ${isOverdue ? "text-red-600" : "text-gray-500"}`}>
                            Rate: {purchase.usdInrRate}
                          </span>
                        </TableCell>
                        <TableCell className={`font-bold ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                          {purchase.dueDate ? formatDate(purchase.dueDate) : 'Not set'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingPurchase(purchase);
                                  setIsPurchaseFormOpen(true);
                                }}
                                className="text-black hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletePurchase(purchase)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-black">Payments</h3>
                  <p className="text-gray-600">Track payments made to this vendor</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingPayment(null);
                    setIsPaymentFormOpen(true);
                  }}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="paymentDateFrom" className="text-black">From Date</Label>
                      <Input
                        id="paymentDateFrom"
                        type="date"
                        value={paymentDateFrom}
                        onChange={(e) => setPaymentDateFrom(e.target.value)}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentDateTo" className="text-black">To Date</Label>
                      <Input
                        id="paymentDateTo"
                        type="date"
                        value={paymentDateTo}
                        onChange={(e) => setPaymentDateTo(e.target.value)}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="flex items-end space-x-2 md:col-span-2">
                      <Button
                        onClick={() => {
                          setIsLoading(true);
                          fetchVendor();
                        }}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button
                        onClick={() => {
                          setPaymentDateFrom('');
                          setPaymentDateTo('');
                          setIsLoading(true);
                          fetchVendor();
                        }}
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader className="bg-black">
                  <TableRow className="bg-black">
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Amount (INR)</TableHead>
                    <TableHead className="text-white">Mode</TableHead>
                    <TableHead className="text-white">Note</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendor.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No payments found. Add the first payment to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendor.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-black font-medium">
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell className="text-black font-medium">
                          {formatCurrency(payment.amountINR)}
                        </TableCell>
                        <TableCell className="text-gray-700">{payment.mode}</TableCell>
                        <TableCell className="text-gray-700">{payment.note || '-'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingPayment(payment);
                                  setIsPaymentFormOpen(true);
                                }}
                                className="text-black hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletePayment(payment)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialogs */}
      <PurchaseFormDialog
        open={isPurchaseFormOpen}
        onOpenChange={setIsPurchaseFormOpen}
        vendorId={vendorId}
        purchase={editingPurchase}
        onSuccess={handleFormSuccess}
      />

      <PaymentFormDialog
        open={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        vendorId={vendorId}
        payment={editingPayment}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmDialog
        open={!!deletePurchase}
        onOpenChange={(open) => !open && setDeletePurchase(null)}
        title="Delete Purchase"
        description="Are you sure you want to delete this purchase? This action cannot be undone."
        onConfirm={() => deletePurchase && handleDeletePurchase(deletePurchase)}
      />

      <DeleteConfirmDialog
        open={!!deletePayment}
        onOpenChange={(open) => !open && setDeletePayment(null)}
        title="Delete Payment"
        description="Are you sure you want to delete this payment? This action cannot be undone."
        onConfirm={() => deletePayment && handleDeletePayment(deletePayment)}
      />
    </AdminLayout>
  );
}
