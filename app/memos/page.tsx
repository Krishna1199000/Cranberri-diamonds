"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2, FileText, ArrowLeft, Building2, ChevronDown, Users, Eye, RotateCcw, Archive } from "lucide-react";
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

interface MemoItem {
  description: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  shape?: string | null;
  reportNo: string;
  pricePerCarat: number;
}

interface Memo {
  id: string;
  memoNo: string;
  date: string;
  dueDate: string;
  companyName: string;
  state: string;
  totalAmount: number;
  items?: MemoItem[];
  user?: { id: string; name: string; email: string };
  createdAt: string;
}

interface ReturnedMemo extends Memo {
  memoTerms?: number;
  returnDate?: string | null;
  processedBy?: string | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatStoneDetails(item: MemoItem): string {
  const parts = [
    `Rpt ${item.reportNo}`,
    `${item.carat}ct`,
    item.color,
    item.clarity,
    item.shape,
    item.lab,
  ].filter(Boolean);
  return parts.join(' · ');
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [returnedMemos, setReturnedMemos] = useState<ReturnedMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnedMemosLoading, setReturnedMemosLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnConfirmDialog, setReturnConfirmDialog] = useState<{
    isOpen: boolean;
    memo: Memo | null;
  }>({ isOpen: false, memo: null });
  const [activeTab, setActiveTab] = useState("current");
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

  const fetchCurrentMemos = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters - only fetch ACTIVE memos for current tab
      const params = new URLSearchParams();
      params.append('status', 'ACTIVE'); // Only current memos
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

      const response = await fetch(`/api/memos?${params.toString()}`);
      const data = await response.json();
      
      if (data.memos) {
        setMemos(data.memos);
        
        // Extract unique values for filters
        const uniqueCompanies = new Set<string>();
        const uniqueStates = new Set<string>();
        const uniqueShapes = new Set<string>();
        const uniqueColors = new Set<string>();
        const uniqueClarities = new Set<string>();
        const uniqueLabs = new Set<string>();
        
        data.memos.forEach((memo: Memo) => {
          if (memo.companyName) uniqueCompanies.add(memo.companyName);
          if (memo.state) uniqueStates.add(memo.state);
          memo.items?.forEach((item: MemoItem) => {
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
      console.error("Failed to fetch memos:", error);
      toast.error("Failed to load memos.");
    } finally {
      setLoading(false);
    }
  }, [userRole, selectedEmployees, selectedCompanies, selectedStates, selectedShapes, selectedColors, selectedClarities, selectedLabs, caratRange, dateRange]);

  const fetchReturnedMemos = useCallback(async () => {
    setReturnedMemosLoading(true);
    try {
      // Build query parameters for returned memos
      const params = new URLSearchParams();
      params.append('status', 'RETURNED'); // Only returned memos
      if (userRole === 'admin' && selectedEmployees.length > 0) {
        params.append('employeeIds', selectedEmployees.join(','));
      }
      if (selectedCompanies.length > 0) {
        params.append('companies', selectedCompanies.join(','));
      }
      if (selectedStates.length > 0) {
        params.append('states', selectedStates.join(','));
      }
      if (dateRange.start) {
        params.append('dateStart', dateRange.start);
      }
      if (dateRange.end) {
        params.append('dateEnd', dateRange.end);
      }

      const response = await fetch(`/api/memos/returned?${params.toString()}`);
      const data = await response.json();
      
      if (data.memos) {
        setReturnedMemos(data.memos);
      }
    } catch (error) {
      console.error("Failed to fetch returned memos:", error);
      toast.error("Failed to load returned memos.");
    } finally {
      setReturnedMemosLoading(false);
    }
  }, [userRole, selectedEmployees, selectedCompanies, selectedStates, dateRange]);

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
    fetchCurrentMemos();
  }, [fetchCurrentMemos]);

  useEffect(() => {
    if (activeTab === 'returned') {
      fetchReturnedMemos();
    }
  }, [fetchReturnedMemos, activeTab]);

  const handleDelete = async (memoId: string) => {
    if (!window.confirm("Are you sure you want to delete this memo? This action cannot be undone.")) {
        return;
    }
    
    setDeletingId(memoId);
    
    try {
        const response = await fetch(`/api/memos/${memoId}`, {
            method: 'DELETE',
        });

        const errorData = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(errorData.error || errorData.message || 'Failed to delete memo');
        }

        toast.success("Memo deleted successfully");
        fetchCurrentMemos();
    } catch (error) {
        console.error("Error deleting memo:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete memo');
    } finally {
        setDeletingId(null);
    }
  };

  const handleMarkAsReturned = async (memo: Memo) => {
    setReturnConfirmDialog({ isOpen: true, memo });
  };

  const confirmReturn = async () => {
    if (!returnConfirmDialog.memo) return;
    
    setReturningId(returnConfirmDialog.memo.id);
    
    try {
        const response = await fetch(`/api/memos/${returnConfirmDialog.memo.id}/return`, {
            method: 'PATCH',
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to mark memo as returned');
        }
        toast.success("Memo marked as returned successfully");
        
        // Refresh both lists
        fetchCurrentMemos();
        fetchReturnedMemos();
        
        // Close dialog
        setReturnConfirmDialog({ isOpen: false, memo: null });
    } catch (error) {
        console.error("Error marking memo as returned:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to mark memo as returned');
    } finally {
        setReturningId(null);
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
  const memosOverTimeData = useMemo(() => {
    const grouped: Record<string, { date: string; count: number; total: number; timestamp: number }> = {};
    
    memos.forEach(memo => {
      const dateObj = new Date(memo.date);
      // Group by week if more than 30 data points, otherwise by day
      const shouldGroupByWeek = memos.length > 30;
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
        grouped[dateKey].total += memo.totalAmount;
      } else {
        grouped[dateKey] = {
          date: dateStr,
          count: 1,
          total: memo.totalAmount,
          timestamp: dateObj.getTime()
        };
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ date, count, total }) => ({ date, count, total }));
  }, [memos]);

  const memosByStateData = useMemo(() => {
    const grouped: Record<string, { name: string; count: number; total: number }> = {};
    
    memos.forEach(memo => {
      const state = memo.state || 'Unknown';
      if (grouped[state]) {
        grouped[state].count += 1;
        grouped[state].total += memo.totalAmount;
      } else {
        grouped[state] = {
          name: state,
          count: 1,
          total: memo.totalAmount
        };
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [memos]);

  const memosByShapeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    memos.forEach(memo => {
      memo.items?.forEach((item: MemoItem) => {
        const shape = item.shape || 'Unknown';
        grouped[shape] = (grouped[shape] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [memos]);

  const memosByColorData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    memos.forEach(memo => {
      memo.items?.forEach((item: MemoItem) => {
        const color = item.color || 'Unknown';
        grouped[color] = (grouped[color] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [memos]);

  const memosByClarityData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    memos.forEach(memo => {
      memo.items?.forEach((item: MemoItem) => {
        const clarity = item.clarity || 'Unknown';
        grouped[clarity] = (grouped[clarity] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [memos]);

  const memosByLabData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    memos.forEach(memo => {
      memo.items?.forEach((item: MemoItem) => {
        const lab = item.lab || 'Unknown';
        grouped[lab] = (grouped[lab] || 0) + 1;
      });
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [memos]);

  const memosByCompanyData = useMemo(() => {
    const grouped: Record<string, { name: string; count: number; total: number }> = {};
    
    memos.forEach(memo => {
      if (grouped[memo.companyName]) {
        grouped[memo.companyName].count += 1;
        grouped[memo.companyName].total += memo.totalAmount;
      } else {
        grouped[memo.companyName] = {
          name: memo.companyName,
          count: 1,
          total: memo.totalAmount
        };
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Limit to top 8 for cleaner display
  }, [memos]);

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
    
    memos.forEach(memo => {
      memo.items?.forEach((item: MemoItem) => {
        const carat = item.carat || 0;
        const index = ranges.findIndex(r => carat >= r.min && carat < r.max);
        if (index >= 0) {
          counts[index].count += 1;
        }
      });
    });
    
    return counts.filter(c => c.count > 0);
  }, [memos]);

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Memos</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/memos/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Memo
            </Button>
          </Link>
          <Link href="/memos/lot-b">
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Lot B Memo
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Current Memos ({memos.length})
            </TabsTrigger>
            <TabsTrigger value="returned" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Return Memo ({returnedMemos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {memos.length === 0 ? (
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>No Current Memos</CardTitle>
                  <CardDescription>All memos are out with clients or have been returned.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
                  <Link href="/memos/new">
                    <Button>Create New Memo</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Comprehensive Filter Bar */}
          <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Filter Memos</h2>
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
          {memos.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Always show Over Time graph */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Memos Over Time</CardTitle>
                  <CardDescription>Track memo creation and total amount trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={memosOverTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          angle={memosOverTimeData.length > 10 ? -45 : 0}
                          textAnchor={memosOverTimeData.length > 10 ? "end" : "middle"}
                          height={memosOverTimeData.length > 10 ? 80 : 40}
                          interval={memosOverTimeData.length > 15 ? Math.floor(memosOverTimeData.length / 10) : 0}
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
                          name="Memo Count" 
                          stroke="#3b82f6" 
                          strokeWidth={2.5}
                          dot={{ fill: '#3b82f6', r: memosOverTimeData.length > 30 ? 2 : 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="total" 
                          name="Total Amount" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ fill: '#10b981', r: memosOverTimeData.length > 30 ? 2 : 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Show State graph only if states are selected or no filters */}
              {(shouldShowGraph.showAll || selectedStates.length > 0) && memosByStateData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Memos by State</CardTitle>
                    <CardDescription>Distribution of memos across states</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={memosByStateData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
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
                          <Bar dataKey="count" name="Memo Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="total" name="Total Amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Shape graph only if shapes are selected or no filters */}
              {(shouldShowGraph.showAll || selectedShapes.length > 0) && memosByShapeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Memos by Shape</CardTitle>
                    <CardDescription>Distribution of diamond shapes in memos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={memosByShapeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
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
              {(shouldShowGraph.showAll || selectedColors.length > 0) && memosByColorData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Memos by Color</CardTitle>
                    <CardDescription>Distribution of diamond colors in memos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={memosByColorData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => memosByColorData.length <= 6 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {memosByColorData.map((entry, index) => (
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
              {(shouldShowGraph.showAll || selectedClarities.length > 0) && memosByClarityData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Memos by Clarity</CardTitle>
                    <CardDescription>Distribution of diamond clarities in memos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={memosByClarityData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
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
              {(shouldShowGraph.showAll || selectedLabs.length > 0) && memosByLabData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Memos by Lab</CardTitle>
                    <CardDescription>Distribution of certification labs in memos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={memosByLabData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => memosByLabData.length <= 6 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {memosByLabData.map((entry, index) => (
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
                    <CardDescription>Distribution of diamond carat weights in memos</CardDescription>
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
              {(shouldShowGraph.showAll || selectedCompanies.length > 0) && memosByCompanyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Top Companies by Memo Amount</CardTitle>
                    <CardDescription>Compare memo totals across companies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={memosByCompanyData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
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
                    <TableHead>Memo No</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memos.map((memo) => (
                    <TableRow key={memo.id}>
                      <TableCell className="font-semibold text-primary">{memo.memoNo}</TableCell>
                      <TableCell>{memo.companyName}</TableCell>
                      <TableCell>{memo.state || 'N/A'}</TableCell>
                      <TableCell>{new Date(memo.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(memo.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(memo.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/memos/${memo.id}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          {userRole === 'admin' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsReturned(memo)}
                                disabled={returningId === memo.id}
                                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                              >
                                {returningId === memo.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                                Mark as Returned
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(memo.id)}
                                disabled={deletingId === memo.id}
                                aria-label="Delete memo"
                                className="flex items-center gap-1"
                              >
                                {deletingId === memo.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" /> 
                                )}
                                Delete
                              </Button>
                            </>
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
          </TabsContent>

          <TabsContent value="returned" className="space-y-6">
            {returnedMemosLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : returnedMemos.length === 0 ? (
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>No Return Memos</CardTitle>
                  <CardDescription>No memos have been marked as returned yet.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
                  <Archive className="w-16 h-16 text-muted-foreground mb-4"/>
                  <p className="text-muted-foreground">Return history will appear here once memos are marked as returned.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Return Memo</CardTitle>
                  <CardDescription>Permanent record of all returned memos for audit purposes. These records cannot be deleted or reverted.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Memo No</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Memo Terms</TableHead>
                        <TableHead>Return Date</TableHead>
                        <TableHead>Stones Included</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead>Processed By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnedMemos.map((memo) => (
                        <TableRow key={memo.id}>
                          <TableCell className="font-semibold text-primary">{memo.memoNo}</TableCell>
                          <TableCell>{memo.companyName}</TableCell>
                          <TableCell>{new Date(memo.date).toLocaleDateString()}</TableCell>
                          <TableCell>{memo.memoTerms} days</TableCell>
                          <TableCell>
                            {memo.returnDate ? (
                              <div>
                                <div>{new Date(memo.returnDate).toLocaleDateString()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(memo.returnDate).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md space-y-1">
                              {memo.items && memo.items.length > 0 ? (
                                memo.items.map((item: MemoItem, idx: number) => (
                                  <p key={`${item.reportNo}-${idx}`} className="text-xs text-muted-foreground">
                                    {formatStoneDetails(item)}
                                  </p>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">No stones</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(memo.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {memo.processedBy || 'System'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/memos/${memo.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <Dialog 
          open={returnConfirmDialog.isOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setReturnConfirmDialog({ isOpen: false, memo: null });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Memo as Returned</DialogTitle>
              <DialogDescription className="space-y-2 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>Are you sure you want to mark this memo as returned?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Move the memo to the Return Memo tab</li>
                    <li>Record the current date and time as the return date</li>
                    <li>Disable any active overdue notifications</li>
                    <li>Create a permanent audit record (cannot be deleted)</li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            {returnConfirmDialog.memo && (
              <div className="py-4 space-y-2">
                <p><strong>Memo Number:</strong> {returnConfirmDialog.memo.memoNo}</p>
                <p><strong>Client:</strong> {returnConfirmDialog.memo.companyName}</p>
                <p><strong>Total Value:</strong> {formatCurrency(returnConfirmDialog.memo.totalAmount)}</p>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setReturnConfirmDialog({ isOpen: false, memo: null })}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmReturn}
                disabled={returningId !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {returningId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Return'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
      )}
    </>
  );
}
