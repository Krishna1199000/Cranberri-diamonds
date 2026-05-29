"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  CheckSquare, 
  AlertCircle, 
  RotateCcw, 
  DollarSign,
  Users,
  Package
} from "lucide-react";

// Import our analytics components
import { FilterPanel, type AnalyticsFilters } from "@/components/analytics/FilterPanel";
import {
  TimeSeriesChart,
  ValueChart,
  CategoryBarChart,
  DistributionPieChart,
  StatusCard,
  OutstandingList
} from "@/components/analytics/ChartComponents";
import { toast } from 'sonner';
import { AdminLayout } from "@/components/layout/AdminLayout";

// Category definitions
type CategoryType = 'memo' | 'invoice' | 'requirements' | 'outstanding' | 'returnMemo' | 'overall';

interface CategorySelection {
  id: CategoryType;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
}

const CATEGORIES: CategorySelection[] = [
  {
    id: 'memo',
    label: 'Memo',
    description: 'Memos generated over time, total memo value, active vs expired memos',
    icon: <FileText className="h-5 w-5" />,
    selected: false
  },
  {
    id: 'invoice',
    label: 'Invoice',
    description: 'Invoices over time, total invoice value, breakdown by payment status',
    icon: <DollarSign className="h-5 w-5" />,
    selected: false
  },
  {
    id: 'requirements',
    label: 'Requirements',
    description: 'Requirements logged over time, breakdown by shape/carat/colour/clarity',
    icon: <CheckSquare className="h-5 w-5" />,
    selected: false
  },
  {
    id: 'outstanding',
    label: 'Outstanding List',
    description: 'Payment Received total value and Payment Due overdue amounts',
    icon: <AlertCircle className="h-5 w-5" />,
    selected: false
  },
  {
    id: 'returnMemo',
    label: 'Return Memo',
    description: 'Memos returned over time, value of returns, return rate',
    icon: <RotateCcw className="h-5 w-5" />,
    selected: false
  },
  {
    id: 'overall',
    label: 'Overall Data',
    description: 'Combined master dashboard aggregating all categories above',
    icon: <BarChart3 className="h-5 w-5" />,
    selected: false
  }
];

// Default filter state
const defaultFilters: AnalyticsFilters = {
  users: [],
  companies: [],
  states: [],
  shapes: [],
  caratRange: { min: null, max: null },
  clarityGrades: [],
  colourWhite: [],
  colourFancy: [],
  dateRange: { startDate: null, endDate: null },
  labs: []
};

export default function AdminAnalyticsPage() {
  const [categories, setCategories] = useState<CategorySelection[]>(CATEGORIES);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data states for different categories
  const [memoData, setMemoData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [requirementsData, setRequirementsData] = useState<any>(null);
  const [outstandingData, setOutstandingData] = useState<any>(null);
  const [returnMemoData, setReturnMemoData] = useState<any>(null);
  const [overallData, setOverallData] = useState<any>(null);

  // Handle category selection
  const handleCategoryToggle = (categoryId: CategoryType) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, selected: !cat.selected }
          : cat
      )
    );
  };

  // Get selected categories
  const selectedCategories = categories.filter(cat => cat.selected);

  // Show filters when categories are selected
  useEffect(() => {
    setShowFilters(selectedCategories.length > 0);
  }, [selectedCategories]);

  // Fetch data for selected categories
  const fetchAnalyticsData = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category to view analytics');
      return;
    }

    setLoading(true);
    
    try {
      const fetchPromises = selectedCategories.map(async (category) => {
        const categoryEndpointMap: Record<CategoryType, string> = {
          memo: 'memo-data',
          invoice: 'invoice-data',
          requirements: 'requirements-data',
          outstanding: 'outstanding-data',
          returnMemo: 'return-memo-data',
          overall: 'overall-data',
        };

        const response = await fetch(`/api/analytics/${categoryEndpointMap[category.id]}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${category.label} data`);
        }

        const data = await response.json();
        return { categoryId: category.id, data };
      });

      const results = await Promise.all(fetchPromises);
      
      // Update data states based on results
      results.forEach(({ categoryId, data }) => {
        switch (categoryId) {
          case 'memo':
            setMemoData(data);
            break;
          case 'invoice':
            setInvoiceData(data);
            break;
          case 'requirements':
            setRequirementsData(data);
            break;
          case 'outstanding':
            setOutstandingData(data);
            break;
          case 'returnMemo':
            setReturnMemoData(data);
            break;
          case 'overall':
            setOverallData(data);
            break;
        }
      });

      toast.success('Analytics data loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter application
  const handleApplyFilters = () => {
    fetchAnalyticsData();
  };

  // Reset all selections
  const handleReset = () => {
    setCategories(CATEGORIES.map(cat => ({ ...cat, selected: false })));
    setFilters(defaultFilters);
    setMemoData(null);
    setInvoiceData(null);
    setRequirementsData(null);
    setOutstandingData(null);
    setReturnMemoData(null);
    setOverallData(null);
  };

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Interactive, filterable sales and operations graphs for management
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All
        </Button>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Analytics Categories
            {selectedCategories.length > 0 && (
              <Badge variant="secondary">{selectedCategories.length} selected</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Choose one or more categories to analyze. All selected categories will display together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  category.selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={category.selected}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <h3 className="font-medium">{category.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
          loading={loading}
        />
      )}

      {/* Analytics Content */}
      {selectedCategories.length > 0 && (
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard View</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards Row */}
            {(memoData || invoiceData || requirementsData) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {memoData && (
                  <>
                    <StatusCard
                      title="Total Memos"
                      value={memoData.summary?.totalMemos || 0}
                      description="Generated memos"
                      icon={<FileText className="h-4 w-4" />}
                    />
                    <StatusCard
                      title="Memo Value"
                      value={memoData.summary?.totalValue || 0}
                      description="Total memo amount"
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                  </>
                )}
                {invoiceData && (
                  <>
                    <StatusCard
                      title="Total Invoices"
                      value={invoiceData.summary?.totalInvoices || 0}
                      description="Generated invoices"
                      icon={<FileText className="h-4 w-4" />}
                    />
                    <StatusCard
                      title="Invoice Value"
                      value={invoiceData.summary?.totalValue || 0}
                      description="Total invoice amount"
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                  </>
                )}
                {requirementsData && (
                  <StatusCard
                    title="Requirements"
                    value={requirementsData.summary?.totalRequirements || 0}
                    description="Total requirements logged"
                    icon={<CheckSquare className="h-4 w-4" />}
                  />
                )}
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Memo Charts */}
              {memoData && (
                <>
                  <TimeSeriesChart
                    data={memoData.timeSeries || []}
                    title="Memos Over Time"
                    description="Daily memo generation trend"
                    loading={loading}
                  />
                  <DistributionPieChart
                    data={memoData.activeVsExpired || []}
                    title="Active vs Expired Memos"
                    description="Current memo status distribution"
                    loading={loading}
                  />
                </>
              )}

              {/* Invoice Charts */}
              {invoiceData && (
                <>
                  <ValueChart
                    data={invoiceData.timeSeries || []}
                    title="Invoice Value Over Time"
                    description="Daily invoice value trend"
                    loading={loading}
                  />
                  <DistributionPieChart
                    data={invoiceData.paymentStatus || []}
                    title="Payment Status Distribution"
                    description="Pending vs Paid invoices"
                    loading={loading}
                  />
                </>
              )}

              {/* Requirements Charts */}
              {requirementsData && (
                <>
                  <CategoryBarChart
                    data={requirementsData.shapeBreakdown || []}
                    title="Requirements by Shape"
                    description="Most requested diamond shapes"
                    loading={loading}
                  />
                  <CategoryBarChart
                    data={requirementsData.caratBreakdown || []}
                    title="Requirements by Carat Range"
                    description="Carat weight distribution"
                    loading={loading}
                  />
                  <CategoryBarChart
                    data={requirementsData.colourBreakdown || []}
                    title="Requirements by Colour"
                    description="White and fancy colour demand"
                    loading={loading}
                  />
                  <CategoryBarChart
                    data={requirementsData.clarityBreakdown || []}
                    title="Requirements by Clarity"
                    description="Clarity grade distribution"
                    loading={loading}
                  />
                </>
              )}

              {/* Return Memo Charts */}
              {returnMemoData && (
                <>
                  <TimeSeriesChart
                    data={returnMemoData.timeSeries || []}
                    title="Memo Returns Over Time"
                    description="Daily memo return trend"
                    loading={loading}
                  />
                  <DistributionPieChart
                    data={returnMemoData.returnCategories || []}
                    title="Return Categories"
                    description="Return timing distribution"
                    loading={loading}
                  />
                </>
              )}
            </div>

            {/* Outstanding List */}
            {outstandingData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Received</CardTitle>
                      <CardDescription>Total collected value (filtered)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StatusCard
                        title="Payment Received"
                        value={outstandingData.paymentReceived?.totalValue || 0}
                        description={`${outstandingData.paymentReceived?.count || 0} invoices marked received`}
                        icon={<TrendingUp className="h-4 w-4" />}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Due</CardTitle>
                      <CardDescription>Overdue invoice amounts and counts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StatusCard
                        title="Payment Due"
                        value={outstandingData.paymentDue?.totalValue || 0}
                        description={`${outstandingData.paymentDue?.count || 0} overdue invoices`}
                        icon={<AlertCircle className="h-4 w-4" />}
                      />
                    </CardContent>
                  </Card>
                </div>
                <OutstandingList
                  title="Payment Due — Client List"
                  items={outstandingData.outstandingList || []}
                  loading={loading}
                />
                {outstandingData.severityBreakdown?.length > 0 && (
                  <DistributionPieChart
                    data={outstandingData.severityBreakdown.map((s: { name: string; value: number }) => ({
                      name: s.name,
                      value: s.value,
                    }))}
                    title="Overdue Severity"
                    description="Breakdown by days overdue"
                    loading={loading}
                  />
                )}
              </div>
            )}

            {/* Overall Data Dashboard */}
            {overallData && (
              <div className="space-y-6">
                <Separator />
                <h2 className="text-2xl font-bold">Overall Business Performance</h2>
                
                {/* Overall Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatusCard
                    title="Total Revenue"
                    value={overallData.overview?.totalRevenue || 0}
                    description="Invoice revenue"
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <StatusCard
                    title="Memo Value"
                    value={overallData.overview?.memoValue || 0}
                    description="Active memo value"
                    icon={<FileText className="h-4 w-4" />}
                  />
                  <StatusCard
                    title="Transactions"
                    value={overallData.overview?.totalTransactions || 0}
                    description="Total documents"
                    icon={<Package className="h-4 w-4" />}
                  />
                  <StatusCard
                    title="Clients"
                    value={overallData.summary?.uniqueClients || 0}
                    description="Active clients"
                    icon={<Users className="h-4 w-4" />}
                  />
                  <StatusCard
                    title="Outstanding"
                    value={overallData.overview?.outstandingValue || 0}
                    description={`${overallData.overview?.overdueCount || 0} overdue`}
                    icon={<AlertCircle className="h-4 w-4" />}
                  />
                </div>

                {/* Combined Timeline */}
                <ValueChart
                  data={overallData.timeline || []}
                  title="Business Activity Timeline"
                  description="Combined view of all business activities"
                  loading={loading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {!memoData && !invoiceData && !requirementsData && !outstandingData && !returnMemoData && !overallData ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Apply filters on the dashboard to load detailed breakdowns.
                </CardContent>
              </Card>
            ) : (
              <>
                {outstandingData?.clientSummary?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Outstanding by Client</CardTitle>
                      <CardDescription>Clients with overdue invoices or memos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="py-2 pr-4">Client</th>
                              <th className="py-2 pr-4">Items</th>
                              <th className="py-2 pr-4">Total Due</th>
                              <th className="py-2">Avg Days Overdue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outstandingData.clientSummary.map((row: {
                              clientName: string;
                              itemCount: number;
                              totalAmount: number;
                              avgDaysOverdue: number;
                            }) => (
                              <tr key={row.clientName} className="border-b">
                                <td className="py-2 pr-4 font-medium">{row.clientName}</td>
                                <td className="py-2 pr-4">{row.itemCount}</td>
                                <td className="py-2 pr-4">
                                  ₹{row.totalAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2">{Math.round(row.avgDaysOverdue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {returnMemoData?.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusCard
                      title="Total Returns"
                      value={returnMemoData.summary.totalReturned || 0}
                      description="Memos marked returned"
                      icon={<RotateCcw className="h-4 w-4" />}
                    />
                    <StatusCard
                      title="Return Value"
                      value={returnMemoData.summary.totalReturnedValue || 0}
                      description="Value of returned memos"
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                    <StatusCard
                      title="Return Rate"
                      value={`${(returnMemoData.summary.returnRate || 0).toFixed(1)}%`}
                      description="Returned vs total memos"
                      icon={<TrendingUp className="h-4 w-4" />}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {invoiceData?.paymentStatus && (
                    <CategoryBarChart
                      data={invoiceData.paymentStatus}
                      title="Invoice Payment Status (Detail)"
                      loading={loading}
                    />
                  )}
                  {memoData?.activeVsExpired && (
                    <DistributionPieChart
                      data={memoData.activeVsExpired}
                      title="Memo Status (Detail)"
                      loading={loading}
                    />
                  )}
                  {requirementsData?.colourBreakdown && (
                    <CategoryBarChart
                      data={requirementsData.colourBreakdown}
                      title="Requirements Colour (Detail)"
                      loading={loading}
                    />
                  )}
                  {requirementsData?.clarityBreakdown && (
                    <CategoryBarChart
                      data={requirementsData.clarityBreakdown}
                      title="Requirements Clarity (Detail)"
                      loading={loading}
                    />
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {selectedCategories.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Categories Selected</h3>
            <p className="text-muted-foreground mb-4">
              Select one or more analytics categories above to start viewing your business data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </AdminLayout>
  );
}