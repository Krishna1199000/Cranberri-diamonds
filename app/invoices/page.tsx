"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2, FileText, ArrowLeft, Building2, ChevronDown, Users, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SessionUser {
    id: string;
    role: 'admin' | 'employee' | 'customer';
    name?: string;
}

interface InvoiceItem {
  description: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  shape?: string | null;
  reportNo: string;
  pricePerCarat: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  companyName: string;
  state: string;
  totalAmount: number;
  paymentStatus?: 'PENDING' | 'PAYMENT_RECEIVED';
  items?: InvoiceItem[];
  user?: { id: string; name: string; email: string };
  createdAt: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<SessionUser['role'] | null>(null);
  
  // Filter states
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedClarities, setSelectedClarities] = useState<string[]>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [caratRange, setCaratRange] = useState({ min: "", max: "" });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Available options
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableShapes, setAvailableShapes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableClarities, setAvailableClarities] = useState<string[]>([]);
  const [availableLabs, setAvailableLabs] = useState<string[]>([]);

  const fetchInvoices = useCallback(async () => {
      setLoading(true);
      try {
      // Build query parameters
      const params = new URLSearchParams();
      if (userRole === 'admin' && selectedEmployees.length > 0) {
        params.append('employeeIds', selectedEmployees.join(','));
      }
      if (selectedCompanies.length > 0) {
        params.append('companies', selectedCompanies.join(','));
      }
      if (selectedStates.length > 0) {
        params.append('states', selectedStates.join(','));
      }
      if (selectedShapes.length > 0) {
        params.append('shapes', selectedShapes.join(','));
      }
      if (selectedColors.length > 0) {
        params.append('colors', selectedColors.join(','));
      }
      if (selectedClarities.length > 0) {
        params.append('clarities', selectedClarities.join(','));
      }
      if (selectedLabs.length > 0) {
        params.append('labs', selectedLabs.join(','));
      }
      if (caratRange.min) {
        params.append('caratMin', caratRange.min);
      }
      if (caratRange.max) {
        params.append('caratMax', caratRange.max);
      }
      if (dateRange.start) {
        params.append('dateStart', dateRange.start);
      }
      if (dateRange.end) {
        params.append('dateEnd', dateRange.end);
      }

      const response = await fetch(`/api/invoices?${params.toString()}`);
        const data = await response.json();
        
        if (data.invoices) {
          setInvoices(data.invoices);
        
        // Extract unique values for filters
        const uniqueCompanies = new Set<string>();
        const uniqueStates = new Set<string>();
        const uniqueShapes = new Set<string>();
        const uniqueColors = new Set<string>();
        const uniqueClarities = new Set<string>();
        const uniqueLabs = new Set<string>();
        
        data.invoices.forEach((inv: Invoice) => {
          if (inv.companyName) uniqueCompanies.add(inv.companyName);
          if (inv.state) uniqueStates.add(inv.state);
          inv.items?.forEach((item: InvoiceItem) => {
            if (item.shape) uniqueShapes.add(item.shape);
            if (item.color) uniqueColors.add(item.color);
            if (item.clarity) uniqueClarities.add(item.clarity);
            if (item.lab) uniqueLabs.add(item.lab);
          });
        });
        
        setAvailableCompanies(Array.from(uniqueCompanies).sort());
        setAvailableStates(Array.from(uniqueStates).sort());
        setAvailableShapes(Array.from(uniqueShapes).sort());
        setAvailableColors(Array.from(uniqueColors).sort());
        setAvailableClarities(Array.from(uniqueClarities).sort());
        setAvailableLabs(Array.from(uniqueLabs).sort());
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
        toast.error("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    }, [userRole, selectedEmployees, selectedCompanies, selectedStates, selectedShapes, selectedColors, selectedClarities, selectedLabs, caratRange, dateRange]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const userResponse = await fetch("/api/auth/me", { credentials: 'include' });
        if (userResponse.ok) {
          const userData: SessionUser = await userResponse.json();
          setUserRole(userData.role);
          
          // Fetch employees for admin
          if (userData.role === 'admin') {
            try {
              const empResponse = await fetch("/api/employees");
              const empData = await empResponse.json();
              if (empData.success && Array.isArray(empData.employees)) {
                setAvailableEmployees(empData.employees);
              }
            } catch (err) {
              console.error("Error fetching employees", err);
            }
          }
        }
      } catch {
        toast.error("Failed to verify user role.");
      }
    };
    
    fetchUserAndData();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
        return;
    }
    
    setDeletingId(invoiceId);
    
    try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete invoice');
        }

        toast.success("Invoice deleted successfully");
        fetchInvoices();
    } catch (error) {
        console.error("Error deleting invoice:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete invoice');
    } finally {
        setDeletingId(null);
    }
  };

  const handlePaymentStatusUpdate = async (
    invoiceId: string,
    newStatus: 'PENDING' | 'PAYMENT_RECEIVED'
  ) => {
    setUpdatingPaymentId(invoiceId);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update payment status');
      }
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, paymentStatus: newStatus } : inv
        )
      );
      toast.success(result.message);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment status');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Determine which graphs to show based on selected filters
  const shouldShowGraph = useMemo(() => {
    const hasFilters = selectedStates.length > 0 || selectedShapes.length > 0 || 
                      selectedColors.length > 0 || selectedClarities.length > 0 || 
                      selectedLabs.length > 0 || selectedCompanies.length > 0;
    return { hasFilters, showAll: !hasFilters };
  }, [selectedStates, selectedShapes, selectedColors, selectedClarities, selectedLabs, selectedCompanies]);

  // Chart data calculations with better aggregation for cleaner graphs
  const invoicesOverTimeData = useMemo(() => {
    const grouped: Record<string, { date: string; count: number; total: number; timestamp: number }> = {};
    
    invoices.forEach(inv => {
      const dateObj = new Date(inv.date);
      // Group by week if more than 30 data points, otherwise by day
      const shouldGroupByWeek = invoices.length > 30;
      let dateKey: string;
      let dateStr: string;
      
      if (shouldGroupByWeek) {
        const weekStart = new Date(dateObj);
        weekStart.setDate(dateObj.getDate() - dateObj.getDay()); // Start of week
        dateKey = weekStart.toISOString().split('T')[0];
        dateStr = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        dateKey = dateObj.toISOString().split('T')[0];
        dateStr = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
      
      if (grouped[dateKey]) {
        grouped[dateKey].count += 1;
        grouped[dateKey].total += inv.totalAmount;
      } else {
        grouped[dateKey] = {
          date: dateStr,
          count: 1,
          total: inv.totalAmount,
          timestamp: dateObj.getTime()
        };
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ date, count, total }) => ({ date, count, total }));
  }, [invoices]);

  const invoicesByStateData = useMemo(() => {
    const grouped: Record<string, { name: string; count: number; total: number }> = {};
    
    invoices.forEach(inv => {
      const state = inv.state || 'Unknown';
      if (grouped[state]) {
        grouped[state].count += 1;
        grouped[state].total += inv.totalAmount;
      } else {
        grouped[state] = {
          name: state,
          count: 1,
          total: inv.totalAmount
        };
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [invoices]);

  const invoicesByShapeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    invoices.forEach(inv => {
      inv.items?.forEach((item: InvoiceItem) => {
        const shape = item.shape || 'Unknown';
        grouped[shape] = (grouped[shape] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [invoices]);

  const invoicesByColorData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    invoices.forEach(inv => {
      inv.items?.forEach((item: InvoiceItem) => {
        const color = item.color || 'Unknown';
        grouped[color] = (grouped[color] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [invoices]);

  const invoicesByClarityData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    invoices.forEach(inv => {
      inv.items?.forEach((item: InvoiceItem) => {
        const clarity = item.clarity || 'Unknown';
        grouped[clarity] = (grouped[clarity] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [invoices]);

  const invoicesByLabData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    invoices.forEach(inv => {
      inv.items?.forEach((item: InvoiceItem) => {
        const lab = item.lab || 'Unknown';
        grouped[lab] = (grouped[lab] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [invoices]);

  const invoicesByCompanyData = useMemo(() => {
    const grouped: Record<string, { name: string; count: number; total: number }> = {};
    
    invoices.forEach(inv => {
      if (grouped[inv.companyName]) {
        grouped[inv.companyName].count += 1;
        grouped[inv.companyName].total += inv.totalAmount;
      } else {
        grouped[inv.companyName] = {
          name: inv.companyName,
          count: 1,
          total: inv.totalAmount
        };
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [invoices]);

  const caratDistributionData = useMemo(() => {
    const ranges = [
      { name: '0-0.5', min: 0, max: 0.5 },
      { name: '0.5-1', min: 0.5, max: 1 },
      { name: '1-2', min: 1, max: 2 },
      { name: '2-3', min: 2, max: 3 },
      { name: '3-5', min: 3, max: 5 },
      { name: '5+', min: 5, max: Infinity },
    ];
    
    const counts = ranges.map(range => ({
      name: range.name,
      count: 0
    }));
    
    invoices.forEach(inv => {
      inv.items?.forEach((item: InvoiceItem) => {
        const carat = item.carat || 0;
        const index = ranges.findIndex(r => carat >= r.min && carat < r.max);
        if (index >= 0) {
          counts[index].count += 1;
        }
      });
    });
    
    return counts.filter(c => c.count > 0);
  }, [invoices]);

  const getBackHref = () => {
    if (userRole === 'admin') return '/Admins';
    if (userRole === 'employee') return '/employee';
    return '/';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href={getBackHref()}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Invoices</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Invoice
            </Button>
          </Link>
          <Link href="/invoices/lot-b">
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Lot B Invoice
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : invoices.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
              <CardTitle>No Invoices Yet</CardTitle>
              <CardDescription>Ready to create your first invoice?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
            <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
            <Link href="/invoices/new">
              <Button>Create Invoice</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Comprehensive Filter Bar */}
          <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Filter Invoices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Employees Filter (Admin only) */}
              {userRole === 'admin' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Employees</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {selectedEmployees.length === 0
                            ? "All employees"
                            : `${selectedEmployees.length} selected`}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 space-y-2">
                      <div className="font-semibold text-sm mb-1">Select employees</div>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {availableEmployees.map((emp) => (
                          <label key={emp.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedEmployees.includes(emp.id)}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setSelectedEmployees((prev) => {
                                  if (checked) {
                                    return [...prev, emp.id]
                                  } else {
                                    return prev.filter((id) => id !== emp.id)
                                  }
                                })
                              }}
                            />
                            <span>{emp.name}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Companies Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Companies</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {selectedCompanies.length === 0
                          ? "All companies"
                          : `${selectedCompanies.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-2">
                    <div className="font-semibold text-sm mb-1">Select companies</div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {availableCompanies.map((company) => (
                        <label key={company} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedCompanies.includes(company)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedCompanies((prev) => {
                                if (checked) {
                                  return [...prev, company]
                                } else {
                                  return prev.filter((c) => c !== company)
                                }
                              })
                            }}
                          />
                          <span>{company}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* States Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">States</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {selectedStates.length === 0
                          ? "All states"
                          : `${selectedStates.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-2">
                    <div className="font-semibold text-sm mb-1">Select states</div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {availableStates.map((state) => (
                        <label key={state} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedStates.includes(state)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedStates((prev) => {
                                if (checked) {
                                  return [...prev, state]
                                } else {
                                  return prev.filter((s) => s !== state)
                                }
                              })
                            }}
                          />
                          <span>{state}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Shapes Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Shapes</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>
                        {selectedShapes.length === 0
                          ? "All shapes"
                          : `${selectedShapes.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-2">
                    <div className="font-semibold text-sm mb-1">Select shapes</div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {availableShapes.map((shape) => (
                        <label key={shape} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedShapes.includes(shape)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedShapes((prev) => {
                                if (checked) {
                                  return [...prev, shape]
                                } else {
                                  return prev.filter((s) => s !== shape)
                                }
                              })
                            }}
                          />
                          <span>{shape}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Colors Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Colors</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>
                        {selectedColors.length === 0
                          ? "All colors"
                          : `${selectedColors.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-2">
                    <div className="font-semibold text-sm mb-1">Select colors</div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {availableColors.map((color) => (
                        <label key={color} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedColors.includes(color)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedColors((prev) => {
                                if (checked) {
                                  return [...prev, color]
                                } else {
                                  return prev.filter((c) => c !== color)
                                }
                              })
                            }}
                          />
                          <span>{color}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clarities Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Clarities</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>
                        {selectedClarities.length === 0
                          ? "All clarities"
                          : `${selectedClarities.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-2">
                    <div className="font-semibold text-sm mb-1">Select clarities</div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {availableClarities.map((clarity) => (
                        <label key={clarity} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedClarities.includes(clarity)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedClarities((prev) => {
                                if (checked) {
                                  return [...prev, clarity]
                                } else {
                                  return prev.filter((c) => c !== clarity)
                                }
                              })
                            }}
                          />
                          <span>{clarity}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Labs Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Labs</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>
                        {selectedLabs.length === 0
                          ? "All labs"
                          : `${selectedLabs.length} selected`}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-2">
                    <div className="font-semibold text-sm mb-1">Select labs</div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {availableLabs.map((lab) => (
                        <label key={lab} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedLabs.includes(lab)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedLabs((prev) => {
                                if (checked) {
                                  return [...prev, lab]
                                } else {
                                  return prev.filter((l) => l !== lab)
                                }
                              })
                            }}
                          />
                          <span>{lab}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Carat Range Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Carat Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={caratRange.min}
                    onChange={(e) => setCaratRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={caratRange.max}
                    onChange={(e) => setCaratRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Professional Graphs - Only show graphs for selected filters */}
          {invoices.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Always show Over Time graph */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Invoices Over Time</CardTitle>
                  <CardDescription>Track invoice creation and total amount trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={invoicesOverTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          angle={invoicesOverTimeData.length > 10 ? -45 : 0}
                          textAnchor={invoicesOverTimeData.length > 10 ? "end" : "middle"}
                          height={invoicesOverTimeData.length > 10 ? 80 : 40}
                          interval={invoicesOverTimeData.length > 15 ? Math.floor(invoicesOverTimeData.length / 10) : 0}
                          minTickGap={10}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickLine={{ stroke: '#d1d5db' }}
                          axisLine={{ stroke: '#d1d5db' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickLine={{ stroke: '#d1d5db' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'total') {
                              return [`$${value.toLocaleString()}`, 'Total Amount'];
                            }
                            return [value, 'Count'];
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="count" 
                          name="Invoice Count" 
                          stroke="#3b82f6" 
                          strokeWidth={2.5}
                          dot={{ fill: '#3b82f6', r: invoicesOverTimeData.length > 30 ? 2 : 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="total" 
                          name="Total Amount" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ fill: '#10b981', r: invoicesOverTimeData.length > 30 ? 2 : 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Show State graph only if states are selected or no filters */}
              {(shouldShowGraph.showAll || selectedStates.length > 0) && invoicesByStateData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Invoices by State</CardTitle>
                    <CardDescription>Distribution of invoices across states</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={invoicesByStateData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            angle={-30}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: '#d1d5db' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="count" name="Invoice Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="total" name="Total Amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Shape graph only if shapes are selected or no filters */}
              {(shouldShowGraph.showAll || selectedShapes.length > 0) && invoicesByShapeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Invoices by Shape</CardTitle>
                    <CardDescription>Distribution of diamond shapes in invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={invoicesByShapeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-30}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: '#d1d5db' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="value" name="Item Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Color graph only if colors are selected or no filters */}
              {(shouldShowGraph.showAll || selectedColors.length > 0) && invoicesByColorData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Invoices by Color</CardTitle>
                    <CardDescription>Distribution of diamond colors in invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={invoicesByColorData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => invoicesByColorData.length <= 6 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {invoicesByColorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Clarity graph only if clarities are selected or no filters */}
              {(shouldShowGraph.showAll || selectedClarities.length > 0) && invoicesByClarityData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Invoices by Clarity</CardTitle>
                    <CardDescription>Distribution of diamond clarities in invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={invoicesByClarityData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-30}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: '#d1d5db' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="value" name="Item Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Lab graph only if labs are selected or no filters */}
              {(shouldShowGraph.showAll || selectedLabs.length > 0) && invoicesByLabData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Invoices by Lab</CardTitle>
                    <CardDescription>Distribution of certification labs in invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={invoicesByLabData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => invoicesByLabData.length <= 6 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {invoicesByLabData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Carat Distribution graph only if carat range is selected or no filters */}
              {(shouldShowGraph.showAll || caratRange.min || caratRange.max) && caratDistributionData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Carat Distribution</CardTitle>
                    <CardDescription>Distribution of diamond carat weights in invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={caratDistributionData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: '#d1d5db' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="count" name="Item Count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Company graph only if companies are selected or no filters */}
              {(shouldShowGraph.showAll || selectedCompanies.length > 0) && invoicesByCompanyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Top Companies by Invoice Amount</CardTitle>
                    <CardDescription>Compare invoice totals across companies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={invoicesByCompanyData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            angle={-30}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: '#d1d5db' }}
                            axisLine={{ stroke: '#d1d5db' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                          />
                          <Legend />
                          <Bar dataKey="total" name="Total Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Table Layout */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    {userRole === 'admin' && <TableHead>Payment Status</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-semibold text-primary">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.companyName}</TableCell>
                      <TableCell>{invoice.state || 'N/A'}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                      {userRole === 'admin' && (
                        <TableCell>
                          <Select
                            value={invoice.paymentStatus || 'PENDING'}
                            onValueChange={(value) => {
                              void handlePaymentStatusUpdate(
                                invoice.id,
                                value as 'PENDING' | 'PAYMENT_RECEIVED'
                              );
                            }}
                            disabled={updatingPaymentId === invoice.id}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Payment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="PAYMENT_RECEIVED">Payment Received</SelectItem>
                            </SelectContent>
                          </Select>
                          {invoice.paymentStatus === 'PAYMENT_RECEIVED' && (
                            <p className="text-xs text-muted-foreground mt-1">Overdue alerts off</p>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                  <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                  </Link>
                  {userRole === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invoice.id)}
                      disabled={deletingId === invoice.id}
                      aria-label="Delete invoice"
                              className="flex items-center gap-1"
                    >
                      {deletingId === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                                <Trash2 className="h-4 w-4" /> 
                      )}
                       Delete
                    </Button>
                  )}
                </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
