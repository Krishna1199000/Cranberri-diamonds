"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  DollarSign,
  CheckSquare,
  TrendingUp
} from "lucide-react";

// Import our analytics components
import {
  TimeSeriesChart,
  ValueChart,
  CategoryBarChart,
  StatusCard,
} from "@/components/analytics/ChartComponents";
import { toast } from 'sonner';
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";

type StatusBreakdown = { name: string; value: number; amount?: number };

interface InvoiceAnalyticsResponse {
  summary?: {
    totalInvoices?: number;
    totalValue?: number;
    avgInvoiceValue?: number;
    totalStones?: number;
    pendingInvoices?: number;
    paidInvoices?: number;
    pendingValue?: number;
    paidValue?: number;
  };
  timeSeries?: unknown[];
  paymentStatus?: StatusBreakdown[];
}

interface MemoAnalyticsResponse {
  summary?: {
    totalMemos?: number;
    avgMemoValue?: number;
    totalStones?: number;
    activeMemos?: number;
  };
  timeSeries?: unknown[];
  activeVsExpired?: StatusBreakdown[];
}

interface RequirementsAnalyticsResponse {
  summary?: {
    totalRequirements?: number;
    uniqueClients?: number;
    avgCaratRequested?: number;
    mostRequestedShape?: string;
    mostRequestedClarity?: string;
  };
  timeSeries?: unknown[];
  shapeBreakdown?: unknown[];
}

// Empty filters for employee (no filtering allowed)
const emptyFilters = {
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

export default function EmployeeAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<InvoiceAnalyticsResponse | null>(null);
  const [memoData, setMemoData] = useState<MemoAnalyticsResponse | null>(null);
  const [requirementsData, setRequirementsData] = useState<RequirementsAnalyticsResponse | null>(null);

  // Fetch all three required analytics on mount
  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    
    try {
      // Fetch all three analytics in parallel
      const [invoiceResponse, memoResponse, requirementsResponse] = await Promise.all([
        fetch('/api/analytics/invoice-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emptyFilters)
        }),
        fetch('/api/analytics/memo-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emptyFilters)
        }),
        fetch('/api/analytics/requirements-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emptyFilters)
        })
      ]);

      // Check if all responses are successful
      if (!invoiceResponse.ok || !memoResponse.ok || !requirementsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      // Parse all responses
      const [invoiceData, memoData, requirementsData] = await Promise.all([
        invoiceResponse.json(),
        memoResponse.json(),
        requirementsResponse.json()
      ]);

      setInvoiceData(invoiceData);
      setMemoData(memoData);
      setRequirementsData(requirementsData);

      toast.success('Analytics loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployeeLayout>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <p className="text-muted-foreground">
          Company-wide performance metrics and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total Invoices"
          value={invoiceData?.summary?.totalInvoices || 0}
          description="All time invoices"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatusCard
          title="Invoice Value"
          value={invoiceData?.summary?.totalValue || 0}
          description="Total invoice revenue"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatusCard
          title="Total Memos"
          value={memoData?.summary?.totalMemos || 0}
          description="All time memos"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatusCard
          title="Requirements"
          value={requirementsData?.summary?.totalRequirements || 0}
          description="Total logged requirements"
          icon={<CheckSquare className="h-4 w-4" />}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Overall Invoice Graph
            </CardTitle>
            <CardDescription>
              Total company invoices across all time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Invoice Value Over Time */}
              <ValueChart
                data={invoiceData?.timeSeries || []}
                title=""
                loading={loading}
              />
              
              {/* Payment Status Summary */}
              {invoiceData?.paymentStatus && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {invoiceData.paymentStatus.map((status, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">{status.name}</div>
                      <div className="text-lg font-bold">{status.value}</div>
                      <div className="text-xs text-muted-foreground">
                        ₹{(status.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Memo Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Overall Memo Graph
            </CardTitle>
            <CardDescription>
              Total company memos across all time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Memo Count Over Time */}
              <TimeSeriesChart
                data={memoData?.timeSeries || []}
                title=""
                loading={loading}
              />
              
              {/* Active vs Expired Summary */}
              {memoData?.activeVsExpired && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {memoData.activeVsExpired.map((status, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">{status.name}</div>
                      <div className="text-lg font-bold">{status.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requirements Analytics - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Overall Requirements Graph
            </CardTitle>
            <CardDescription>
              Total requirements logged across all time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requirements Over Time */}
              <div>
                <TimeSeriesChart
                  data={requirementsData?.timeSeries || []}
                  title="Requirements Timeline"
                  loading={loading}
                />
              </div>
              
              {/* Most Requested Shapes */}
              <div>
                <CategoryBarChart
                  data={requirementsData?.shapeBreakdown || []}
                  title="Popular Shapes"
                  loading={loading}
                />
              </div>
            </div>

            {/* Requirements Summary Stats */}
            {requirementsData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Unique Clients</div>
                  <div className="text-lg font-bold">
                    {requirementsData.summary.uniqueClients}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Avg Carat</div>
                  <div className="text-lg font-bold">
                    {requirementsData.summary.avgCaratRequested?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Popular Shape</div>
                  <div className="text-lg font-bold">
                    {requirementsData.summary.mostRequestedShape}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Popular Clarity</div>
                  <div className="text-lg font-bold">
                    {requirementsData.summary.mostRequestedClarity}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Insights
          </CardTitle>
          <CardDescription>
            Key performance indicators and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invoice Insights */}
            <div className="space-y-2">
              <h3 className="font-medium">Invoice Performance</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Average Invoice Value: ₹{(invoiceData?.summary?.avgInvoiceValue || 0).toLocaleString('en-IN')}</div>
                <div>Total Stones Sold: {invoiceData?.summary?.totalStones || 0}</div>
                <div>Pending Payments: {invoiceData?.summary?.pendingInvoices || 0}</div>
              </div>
            </div>

            {/* Memo Insights */}
            <div className="space-y-2">
              <h3 className="font-medium">Memo Performance</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Average Memo Value: ₹{(memoData?.summary?.avgMemoValue || 0).toLocaleString('en-IN')}</div>
                <div>Total Stones in Memos: {memoData?.summary?.totalStones || 0}</div>
                <div>Active Memos: {memoData?.summary?.activeMemos || 0}</div>
              </div>
            </div>

            {/* Requirements Insights */}
            <div className="space-y-2">
              <h3 className="font-medium">Requirements Insights</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Total Requirements: {requirementsData?.summary?.totalRequirements || 0}</div>
                <div>Unique Clients: {requirementsData?.summary?.uniqueClients || 0}</div>
                <div>Most Requested: {requirementsData?.summary?.mostRequestedShape || 'N/A'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about Employee Access */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-700">
            <CheckSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Employee Access Level</span>
          </div>
          <p className="text-sm text-amber-600 mt-1">
            This is a read-only overview of company-wide analytics. 
            For detailed analysis and filtering options, please contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
    </EmployeeLayout>
  );
}