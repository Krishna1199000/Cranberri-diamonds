"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PasswordGate } from '@/components/admin/PasswordGate';
import { Button } from '@/components/ui/button';
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
import { Plus, MoreHorizontal, Edit, Trash, Eye, Search, Calendar, Package, CreditCard, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { VendorFormDialog } from '@/components/vendors/VendorFormDialog';
import { DeleteConfirmDialog } from '@/components/vendors/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  location: string;
  totalBusiness: number;
  balanceDue: number;
}

interface VendorDetail {
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
  vendorId: string;
  vendor: {
    companyName: string;
    ownerName: string;
  };
}

interface Payment {
  id: string;
  date: string;
  amountINR: number;
  mode: string;
  note: string;
  vendorId: string;
  vendor: {
    companyName: string;
    ownerName: string;
  };
}

type Transaction = (Purchase & { type: 'purchase' }) | (Payment & { type: 'payment' });

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDetail | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Overview tab states
  const [activeTab, setActiveTab] = useState('vendors');
  const [overviewData, setOverviewData] = useState<{ purchases: Purchase[]; payments: Payment[] }>({ purchases: [], payments: [] });
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  
  // Filter states
  const [dateRange, setDateRange] = useState('all');
  const [transactionType, setTransactionType] = useState('both');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const fetchVendors = useCallback(async () => {
    try {
      const url = debouncedQuery ? `/api/vendors?q=${encodeURIComponent(debouncedQuery)}` : '/api/vendors';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      } else {
        toast.error('Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Error fetching vendors');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  const fetchOverviewData = useCallback(async () => {
    setIsOverviewLoading(true);
    try {
      const [purchasesResponse, paymentsResponse] = await Promise.all([
        fetch('/api/vendors/overview/purchases'),
        fetch('/api/vendors/overview/payments')
      ]);

      if (purchasesResponse.ok && paymentsResponse.ok) {
        const [purchases, payments] = await Promise.all([
          purchasesResponse.json(),
          paymentsResponse.json()
        ]);
        setOverviewData({ purchases, payments });
      } else {
        toast.error('Failed to fetch overview data');
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast.error('Error fetching overview data');
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Fetch overview data when overview tab is active
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
  }, [activeTab, fetchOverviewData]);

  // Debounce the search query
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  // Filtering logic
  const getDateRange = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (dateRange) {
      case 'today':
        return { from: todayStr, to: todayStr };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { from: weekStart.toISOString().split('T')[0], to: todayStr };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { from: monthStart.toISOString().split('T')[0], to: todayStr };
      case 'custom':
        return { from: customDateFrom, to: customDateTo };
      default:
        return { from: '', to: '' };
    }
  };

  const filterOverviewData = () => {
    const { from, to } = getDateRange();
    let filteredPurchases = overviewData.purchases;
    let filteredPayments = overviewData.payments;

    // Filter by date range
    if (from && to) {
      filteredPurchases = overviewData.purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.date).toISOString().split('T')[0];
        return purchaseDate >= from && purchaseDate <= to;
      });
      
      filteredPayments = overviewData.payments.filter(payment => {
        const paymentDate = new Date(payment.date).toISOString().split('T')[0];
        return paymentDate >= from && paymentDate <= to;
      });
    }

    // Filter by type
    if (transactionType === 'purchases') {
      filteredPayments = [];
    } else if (transactionType === 'payments') {
      filteredPurchases = [];
    }

    return { purchases: filteredPurchases, payments: filteredPayments };
  };

  const getOverviewSummary = () => {
    const { purchases, payments } = filterOverviewData();
    
    
    const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + purchase.inrPrice, 0);
    const totalPaymentAmount = payments.reduce((sum, payment) => sum + payment.amountINR, 0);
    const netAmount = totalPaymentAmount - totalPurchaseAmount;

    return {
      totalPurchases: purchases.length,
      totalPayments: payments.length,
      totalPurchaseAmount,
      totalPaymentAmount,
      netAmount
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const isDueDatePassed = (dueDateString: string | null) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  const handleEdit = async (vendor: Vendor) => {
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`);
      if (!res.ok) throw new Error('Failed to load vendor details');
      const fullVendor = await res.json();
      const detail: VendorDetail = {
        id: fullVendor.id,
        companyName: fullVendor.companyName,
        ownerName: fullVendor.ownerName,
        contactNumber: fullVendor.contactNumber,
        address: fullVendor.address,
        gstNumber: fullVendor.gstNumber ?? undefined,
        accountNumber: fullVendor.accountNumber,
        ifscCode: fullVendor.ifscCode,
        bankName: fullVendor.bankName,
        accountHolderName: fullVendor.accountHolderName,
        location: fullVendor.location,
        businessType: fullVendor.businessType,
      };
      setEditingVendor(detail);
      setIsFormOpen(true);
    } catch {
      toast.error('Failed to open edit form');
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Vendor deleted successfully');
        fetchVendors();
      } else {
        toast.error('Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Error deleting vendor');
    }
    setDeleteVendor(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
    fetchVendors();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <PasswordGate
        title="Vendor Management Access"
        description="Enter the password to access vendor management features"
        endpoint="/api/vendors/verify-password"
        sessionKey="vendors_unlocked"
      >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Vendors</h1>
            <p className="text-gray-600">Manage vendor relationships and diamond purchases</p>
          </div>
          {activeTab === 'vendors' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by company, owner, contact, location"
                  className="pl-9 border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingVendor(null);
                  setIsFormOpen(true);
                }}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="vendors" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Vendors ({vendors.length})
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4">
            {/* Vendors Table */}
            <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader className="bg-black">
              <TableRow className="bg-black">
                <TableHead className="text-white">Company Name</TableHead>
                <TableHead className="text-white">Owner</TableHead>
                <TableHead className="text-white">Contact</TableHead>
                <TableHead className="text-white">Location</TableHead>
                <TableHead className="text-white">Total Business</TableHead>
                <TableHead className="text-white">Balance Due</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      <span className="ml-2 text-gray-600">Loading vendors...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No vendors found. Add your first vendor to get started.
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium text-black">
                      {vendor.companyName}
                    </TableCell>
                    <TableCell className="text-gray-700">{vendor.ownerName}</TableCell>
                    <TableCell className="text-gray-700">{vendor.contactNumber}</TableCell>
                    <TableCell className="text-gray-700">{vendor.location}</TableCell>
                    <TableCell className="text-gray-700">
                      {formatCurrency(vendor.totalBusiness)}
                    </TableCell>
                    <TableCell className={`font-medium ${
                      vendor.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(vendor.balanceDue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/vendors/${vendor.id}`}>
                          <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-50">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                            <DropdownMenuItem
                              onClick={() => handleEdit(vendor)}
                              className="text-black hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteVendor(vendor)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Overview Filters
                </CardTitle>
                <CardDescription>Filter purchases and payments by date range and type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-black">Type</Label>
                    <Select value={transactionType} onValueChange={setTransactionType}>
                      <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both Purchases & Payments</SelectItem>
                        <SelectItem value="purchases">Purchases Only</SelectItem>
                        <SelectItem value="payments">Payments Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateRange === 'custom' && (
                    <div className="space-y-2">
                      <Label className="text-black">Custom Date Range</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black"
                          placeholder="From"
                        />
                        <Input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="border-gray-300 focus:border-black focus:ring-black"
                          placeholder="To"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-white border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Purchases</p>
                      <p className="text-2xl font-bold text-black">{getOverviewSummary().totalPurchases}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Payments</p>
                      <p className="text-2xl font-bold text-black">{getOverviewSummary().totalPayments}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Purchase Amount</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(getOverviewSummary().totalPurchaseAmount)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Payment Amount</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(getOverviewSummary().totalPaymentAmount)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Amount</p>
                      <p className={`text-2xl font-bold ${
                        getOverviewSummary().netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(getOverviewSummary().netAmount)}
                      </p>
                    </div>
                    <DollarSign className={`h-8 w-8 ${
                      getOverviewSummary().netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline View */}
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-black">Timeline View</CardTitle>
                <CardDescription>Chronological view of all transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isOverviewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <span className="ml-3 text-gray-600">Loading overview data...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const { purchases, payments } = filterOverviewData();
                      const allTransactions: Transaction[] = [
                        ...purchases.map(p => ({ ...p, type: 'purchase' as const })),
                        ...payments.map(p => ({ ...p, type: 'payment' as const }))
                      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      if (allTransactions.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            No transactions found for the selected filters.
                          </div>
                        );
                      }

                      return allTransactions.map((transaction) => (
                        <div key={`${transaction.type}-${transaction.id}`} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            transaction.type === 'purchase' ? 'bg-red-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {transaction.type === 'purchase' ? (
                                  <Package className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CreditCard className="h-4 w-4 text-green-600" />
                                )}
                                <span className="font-medium text-black">
                                  {transaction.type === 'purchase' ? 'Purchase' : 'Payment'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(transaction.date)}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${
                                  transaction.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {transaction.type === 'purchase' 
                                    ? formatCurrency(transaction.inrPrice)
                                    : formatCurrency(transaction.amountINR)
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  {transaction.vendor.companyName}
                                </p>
                              </div>
                            </div>
                            {transaction.type === 'purchase' && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p>Diamond: {transaction.shape} {transaction.color} {transaction.clarity}</p>
                                <p>Lab: {transaction.lab} | Certificate: {transaction.certificate}</p>
                                {transaction.dueDate && (
                                  <p className={`font-medium ${
                                    isDueDatePassed(transaction.dueDate) ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    Due Date: {formatDate(transaction.dueDate)}
                                    {isDueDatePassed(transaction.dueDate) && ' (Overdue)'}
                                  </p>
                                )}
                              </div>
                            )}
                            {transaction.type === 'payment' && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p>Mode: {transaction.mode}</p>
                                <p>Note: {transaction.note || 'No note provided'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vendor Form Dialog */}
      <VendorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vendor={editingVendor}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteVendor}
        onOpenChange={(open) => !open && setDeleteVendor(null)}
        title="Delete Vendor"
        description={`Are you sure you want to delete ${deleteVendor?.companyName}? This action cannot be undone.`}
        onConfirm={() => deleteVendor && handleDelete(deleteVendor)}
      />
      </PasswordGate>
    </AdminLayout>
  );
}
