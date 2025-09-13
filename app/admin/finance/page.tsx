"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PasswordGate } from '@/components/finance/PasswordGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Plus, MoreHorizontal, Edit, Trash, Download, Filter, RotateCcw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { SaleFormDialog } from '@/components/finance/SaleFormDialog';
import { DeleteConfirmDialog } from '@/components/vendors/DeleteConfirmDialog';
import { CreditCardsPanel } from '@/components/finance/CreditCardsPanel';

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
  shippingCharge: number;
  employeeProfitPercent: number;
  finalProfit: number;
  dueDate: string;
}

interface PLStats {
  totalSales: number;
  totalPurchases: number;
  grossProfit: number;
  employeeDeductions: number;
  netProfit: number;
  matchedCertificates: number;
  unmatchedSales: number;
}

export default function FinancePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<PLStats>({
    totalSales: 0,
    totalPurchases: 0,
    grossProfit: 0,
    employeeDeductions: 0,
    netProfit: 0,
    matchedCertificates: 0,
    unmatchedSales: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteSale, setDeleteSale] = useState<Sale | null>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSales = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);

      const response = await fetch(`/api/finance/enhanced-sales?${params}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched data:', data);
        setSales(data);
        
        // Calculate stats from enhanced sales data
        const totalSales = data.reduce((sum: number, sale: Sale) => sum + sale.totalPriceSoldINR, 0);
        const totalPurchases = data.reduce((sum: number, sale: Sale) => sum + sale.totalPricePurchasedINR, 0);
        const grossProfit = totalSales - totalPurchases;
        const employeeDeductions = data.reduce((sum: number, sale: Sale) => sum + ((sale.totalPriceSoldINR * sale.employeeProfitPercent) / 100), 0);
        const netProfit = data.reduce((sum: number, sale: Sale) => sum + sale.finalProfit, 0);
        
        setStats({
          totalSales,
          totalPurchases,
          grossProfit,
          employeeDeductions,
          netProfit,
          matchedCertificates: 0,
          unmatchedSales: 0,
        });
        
        console.log('Stats calculated:', {
          totalSales,
          totalPurchases,
          grossProfit,
          employeeDeductions,
          netProfit,
          matchedCertificates: 0,
          unmatchedSales: 0,
        });
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        toast.error('Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Error fetching sales data');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleFilter = () => {
    setIsLoading(true);
    fetchSales();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setIsLoading(true);
    fetchSales();
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleDelete = async (sale: Sale) => {
    try {
      const response = await fetch(`/api/finance/enhanced-sales/${sale.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Sale deleted successfully');
        fetchSales();
      } else {
        toast.error('Failed to delete sale');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Error deleting sale');
    }
    setDeleteSale(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSale(null);
    fetchSales();
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/finance/enhanced-sales');
      if (response.ok) {
        const data = await response.json();
        
        // Create CSV content
        const csvContent = [
          ['Date', 'Company Name', 'Owner Name', 'Vendor Company', 'Shape', 'Carat', 'Color', 'Clarity', 'Lab', 'Certificate', 'Total Price Sold', 'Total Purchase', 'Shipping Charge', 'Profit', 'Employee Profit %', 'Employee Profit INR', 'Final Profit', 'Due Date'],
          ...data.map((sale: Sale) => [
            formatDate(sale.date),
            sale.companyName,
            sale.ownerName,
            sale.vendorCompany,
            sale.shape,
            sale.carat,
            sale.color,
            sale.clarity,
            sale.lab,
            sale.certificateNumber,
            sale.totalPriceSoldINR,
            sale.totalPricePurchasedINR,
            sale.shippingCharge,
            sale.totalPriceSoldINR - sale.totalPricePurchasedINR,
            sale.employeeProfitPercent,
            (sale.totalPriceSoldINR * sale.employeeProfitPercent) / 100,
            sale.finalProfit,
            formatDate(sale.dueDate)
          ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-sales-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Export downloaded');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const isDueDatePassed = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  return (
    <AdminLayout>
      <PasswordGate
        title="Finance Access Required"
        description="Enter the security password to access profit & loss data."
      >
        <div className="space-y-6">
          <Tabs defaultValue="pl" className="space-y-6">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="pl" className="data-[state=active]:bg-white data-[state=active]:text-black">Profit & Loss</TabsTrigger>
              <TabsTrigger value="cards" className="data-[state=active]:bg-white data-[state=active]:text-black">Credit Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="pl" className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-black">Profit & Loss</h1>
                  <p className="text-gray-600">Track sales, purchases, and profit margins</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingSale(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sale
                </Button>
              </div>
              {/* Filters */}
              <Card className="bg-white border">
            <CardHeader>
              <CardTitle className="text-black">Filters</CardTitle>
              <CardDescription>Filter sales by date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-black">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-black">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div className="flex items-end space-x-2 md:col-span-4">
                  <Button
                    onClick={handleFilter}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{formatCurrency(stats.totalSales)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Purchases</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{formatCurrency(stats.totalPurchases)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Gross Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.grossProfit)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Employee Deductions</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{formatCurrency(stats.employeeDeductions)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netProfit)}
                </div>
              </CardContent>
            </Card>

              </div>

              {/* Sales Table */}
              <Card className="bg-white border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-black">Sales Records</CardTitle>
                <CardDescription>Detailed profit and loss per certificate</CardDescription>
              </div>
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-black text-black hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black">
                    <TableRow className="bg-black">
                      <TableHead className="text-white">Sr. No.</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Company Name</TableHead>
                      <TableHead className="text-white">Owner Name</TableHead>
                      <TableHead className="text-white">Vendor Company</TableHead>
                      <TableHead className="text-white">Shape</TableHead>
                      <TableHead className="text-white">Carat</TableHead>
                      <TableHead className="text-white">Color</TableHead>
                      <TableHead className="text-white">Clarity</TableHead>
                      <TableHead className="text-white">Lab</TableHead>
                      <TableHead className="text-white">Certificate</TableHead>
                      <TableHead className="text-white">Total Price Sold</TableHead>
                      <TableHead className="text-white">Total Purchase</TableHead>
                      <TableHead className="text-white">Shipping Charge</TableHead>
                      <TableHead className="text-white">Profit</TableHead>
                      <TableHead className="text-white">Employee Profit %</TableHead>
                      <TableHead className="text-white">Employee Profit INR</TableHead>
                      <TableHead className="text-white">Final Profit</TableHead>
                      <TableHead className="text-white">Due Date</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={20} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                            <span className="ml-2 text-gray-600">Loading sales...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={20} className="text-center py-8 text-gray-500">
                          No sales found. Add your first sale to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale, index) => {
                        const isOverdue = isDueDatePassed(sale.dueDate);
                        return (
                        <TableRow key={sale.id} className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}>
                          <TableCell className={`font-medium ${isOverdue ? "text-red-800" : "text-black"}`}>{index + 1}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{formatDate(sale.date)}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.companyName}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.ownerName}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.vendorCompany}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.shape}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.carat}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.color}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.clarity}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.lab}</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.certificateNumber}</TableCell>
                          <TableCell className={`font-medium ${isOverdue ? "text-red-700" : "text-gray-700"}`}>
                            {formatCurrency(sale.totalPriceSoldINR)}
                          </TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>
                            {formatCurrency(sale.totalPricePurchasedINR)}
                          </TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>
                            {formatCurrency(sale.shippingCharge)}
                          </TableCell>
                          <TableCell className={`font-medium ${
                            isOverdue 
                              ? 'text-red-600' 
                              : (sale.totalPriceSoldINR - sale.totalPricePurchasedINR) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(sale.totalPriceSoldINR - sale.totalPricePurchasedINR)}
                          </TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{sale.employeeProfitPercent}%</TableCell>
                          <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>
                            {formatCurrency((sale.totalPriceSoldINR * sale.employeeProfitPercent) / 100)}
                          </TableCell>
                          <TableCell className={`font-medium ${
                            isOverdue 
                              ? 'text-red-600' 
                              : sale.finalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(sale.finalProfit)}
                          </TableCell>
                          <TableCell className={`font-bold ${isOverdue ? "text-red-600" : "text-gray-700"}`}>{formatDate(sale.dueDate)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(sale)}
                                  className="text-black hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteSale(sale)}
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
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="cards">
              <CreditCardsPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sale Form Dialog */}
        <SaleFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          sale={editingSale}
          onSuccess={handleFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={!!deleteSale}
          onOpenChange={(open) => !open && setDeleteSale(null)}
          title="Delete Sale"
          description={`Are you sure you want to delete the sale for certificate ${deleteSale?.certificateNumber}? This action cannot be undone.`}
          onConfirm={() => deleteSale && handleDelete(deleteSale)}
        />
      </PasswordGate>
    </AdminLayout>
  );
}
