"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Trash2, User, Filter, Download, ArrowLeft, Users, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Link from "next/link";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "recharts";

export default function AdminPerformance() {
  interface Employee {
    id: string;
    name: string;
  }

  interface Report {
    id: string;
    totalCalls: number;
    totalEmails: number;
    requirements: number;
    requirementsReceived: number;
    memoCount: number;
    memoAmount: number;
    memo?: string;
    salesCount: number;
    invoiceAmount: number;
    invoice?: string;
    userId: string;
    date: string;
    user: {
      name: string;
    };
  }
  
  const [reports, setReports] = useState<Report[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(["all"]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    totalCalls: "",
    totalEmails: "",
    requirementsReceived: "",
    memoCounts: "",
    memoAmount: "",
    salesCount: "",
    invoiceAmount: "",
    userId: "",
  });

  // Time filter options
  const timeFilters = [
    { value: "all", label: "All Time" },
    { value: "24hours", label: "Last 24 Hours" },
    { value: "7days", label: "Last 7 Days" },
    { value: "monthly", label: "This Month" },
    { value: "yearly", label: "This Year" },
    { value: "custom", label: "Custom Range" }
  ];

  // Find the name of an employee by their ID
  const getEmployeeName = (userId: string) => {
    if (!userId) return "Select Employee";
    
    // Special case for current admin
    if (currentAdmin && currentAdmin.id === userId) {
      return `${currentAdmin.name} (You)`;
    }
    
    const employee = employees.find(emp => emp.id === userId);
    return employee ? employee.name : "Unknown Employee";
  };

  // Fetch current admin user
  const fetchCurrentAdmin = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: 'include' });
      if (!response.ok) {
        throw new Error("Failed to fetch admin data");
      }
      
      const data = await response.json();
      if (data && data.id && data.name) {
        const admin = {
          id: data.id,
          name: data.name
        };
        setCurrentAdmin(admin);
        
        // Pre-select the admin as the default user for the form
        setFormData(prev => ({
          ...prev,
          userId: admin.id
        }));
      }
    } catch (error) {
      console.error("Error fetching current admin:", error);
      toast.error("Failed to fetch your user profile");
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.employees)) {
        // Make sure all employees have id and name properties
        const validEmployees = data.employees.filter(emp => emp.id && emp.name);
        setEmployees(validEmployees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  // Fetch reports
    const fetchReports = useCallback(async () => {
      try {
        // Build the URL with filters
        let url = "/api/performance/admin?";
        
        // Add employee filter - use first selected if not "all"
        const employeeId = selectedEmployees.length === 1 && !selectedEmployees.includes("all") 
          ? selectedEmployees[0] 
          : selectedEmployee !== "all" ? selectedEmployee : null;
        
        if (employeeId) {
          url += `employeeId=${employeeId}&`;
        }
        
        // Add time filter if specific time period is selected
        if (selectedTimeFilter !== "all") {
          url += `timeFilter=${selectedTimeFilter}&`;
        }
        
        // Remove trailing '&' if exists
        if (url.endsWith('&')) {
          url = url.slice(0, -1);
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.reports)) {
          let filteredReports = data.reports;
          
          // Apply custom date range filter if set
          if (customDateRange.start && customDateRange.end) {
            const startDate = new Date(customDateRange.start);
            const endDate = new Date(customDateRange.end);
            endDate.setHours(23, 59, 59, 999); // Include full end date
            
            filteredReports = filteredReports.filter((report: Report) => {
              const reportDate = new Date(report.date);
              return reportDate >= startDate && reportDate <= endDate;
            });
          }
          
          // Apply multi-employee filter if multiple selected
          if (selectedEmployees.length > 1 || (selectedEmployees.length === 1 && !selectedEmployees.includes("all"))) {
            filteredReports = filteredReports.filter((report: Report) => 
              selectedEmployees.includes(report.userId)
            );
          }
          
          setReports(filteredReports);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to fetch reports");
      }
    }, [selectedEmployee, selectedEmployees, selectedTimeFilter, customDateRange]);

  // Chart data calculations
  const performanceOverTimeData = useMemo(() => {
    const filtered = selectedEmployee === "all" 
      ? reports 
      : reports.filter(r => r.userId === selectedEmployee);
    const grouped: Record<string, { date: string; calls: number; emails: number; requirements: number }> = {};
    filtered.forEach(report => {
      const date = new Date(report.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      if (!grouped[date]) {
        grouped[date] = { date, calls: 0, emails: 0, requirements: 0 };
      }
      grouped[date].calls += report.totalCalls;
      grouped[date].emails += report.totalEmails;
      grouped[date].requirements += report.requirementsReceived;
    });
    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports, selectedEmployee]);

  const performanceByEmployeeData = useMemo(() => {
    const stats: Record<string, { name: string; calls: number; emails: number; requirements: number }> = {};
    reports.forEach(report => {
      const name = report.user?.name || getEmployeeName(report.userId) || "Unknown";
      if (!stats[report.userId]) {
        stats[report.userId] = { name, calls: 0, emails: 0, requirements: 0 };
      }
      stats[report.userId].calls += report.totalCalls;
      stats[report.userId].emails += report.totalEmails;
      stats[report.userId].requirements += report.requirementsReceived;
    });
    return Object.values(stats).slice(0, 5);
  }, [reports]);

  // Find the selected employee object for the FORM dropdown
  const selectedFormEmployeeObject = employees.find(emp => emp.id === formData.userId);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    // First fetch the admin user, then fetch employees
    fetchCurrentAdmin().then(() => {
      fetchEmployees();
    });
  }, []);

  // Ensure admin is added to employee list if not present
  useEffect(() => {
    if (currentAdmin && employees.length > 0) {
      // Check if admin is already in the employees list
      const adminExists = employees.some(emp => emp.id === currentAdmin.id);
      
      if (!adminExists) {
        // Add admin to the employees list
        setEmployees(prev => [currentAdmin, ...prev]);
      }
    }
  }, [currentAdmin, employees]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure we have a valid user ID (fallback to admin if not set)
      if (!formData.userId && currentAdmin) {
        setFormData(prev => ({
          ...prev,
          userId: currentAdmin.id
        }));
      }

      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `/api/performance/admin/${editingId}` 
        : "/api/performance/admin";

      const submitData = {
        ...formData,
        userId: formData.userId || currentAdmin?.id,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Report ${isEditing ? "updated" : "submitted"} successfully`);
        setFormData({
          totalCalls: "",
          totalEmails: "",
          requirementsReceived: "",
          memoCounts: "",
          memoAmount: "",
          salesCount: "",
          invoiceAmount: "",
          // Pre-select admin after form reset
          userId: currentAdmin?.id || "",
        });
        setIsEditing(false);
        setEditingId("");
        
        // Refresh reports
        fetchReports();
      } else {
        toast.error(data.message || `Failed to ${isEditing ? "update" : "submit"} report`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Failed to ${isEditing ? "update" : "submit"} report`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (report: Report) => {
    setIsEditing(true);
    setEditingId(report.id);
    setFormData({
      totalCalls: report.totalCalls.toString(),
      totalEmails: report.totalEmails.toString(),
      requirementsReceived: report.requirementsReceived?.toString() ?? report.requirements?.toString() ?? "",
      memoCounts: "",
      memoAmount: "",
      salesCount: "",
      invoiceAmount: "",
      userId: report.userId,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      try {
        const response = await fetch(`/api/performance/admin/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Report deleted successfully");
          // Refresh reports
          fetchReports();
        } else {
          toast.error("Failed to delete report");
        }
      } catch (error) {
        console.error("Error deleting report:", error);
        toast.error("Failed to delete report");
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = [
        ['Sr No', 'Employee Name', 'Date', 'Total Calls', 'Total Emails', 'Requirements Received', 'Memo', 'Invoice'],
        ...reports.map((report, index) => [
          (index + 1).toString(),
          report.user?.name || 'Unknown',
          new Date(report.date).toLocaleDateString('en-IN'),
          report.totalCalls.toString(),
          report.totalEmails.toString(),
          report.requirementsReceived.toString(),
          report.memo || '',
          report.invoice || ''
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Performance reports exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/Admins/sales">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sales Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Performance Reports</h1>
        </div>
        
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Professional Filter Bar */}
      <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Filter Performance Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Employees Filter */}
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
                    {selectedEmployees.includes("all") || selectedEmployees.length === 0
                      ? "All employees"
                      : `${selectedEmployees.length} selected`}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 space-y-2">
                <div className="font-semibold text-sm mb-1">Select employees</div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedEmployees.includes("all")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees(["all"])
                          setSelectedEmployee("all")
                        } else {
                          setSelectedEmployees([])
                        }
                      }}
                    />
                    <span>All employees</span>
                  </label>
                  {currentAdmin && (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!selectedEmployees.includes("all") && selectedEmployees.includes(currentAdmin.id)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setSelectedEmployees((prev) => {
                            if (checked) {
                              const base = prev.includes("all") ? [] : prev
                              return [...base, currentAdmin.id]
                            } else {
                              return prev.filter((id) => id !== currentAdmin.id)
                            }
                          })
                          if (checked) setSelectedEmployee(currentAdmin.id)
                        }}
                      />
                      <span className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {currentAdmin.name} (You)
                      </span>
                    </label>
                  )}
                  {employees
                    .filter(emp => emp.id !== currentAdmin?.id)
                    .map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!selectedEmployees.includes("all") && selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedEmployees((prev) => {
                              if (checked) {
                                const base = prev.includes("all") ? [] : prev
                                return [...base, emp.id]
                              } else {
                                return prev.filter((id) => id !== emp.id)
                              }
                            })
                            if (checked) setSelectedEmployee(emp.id)
                          }}
                        />
                        <span>{emp.name}</span>
                      </label>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Period Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Time Period</label>
            <Select value={selectedTimeFilter} onValueChange={setSelectedTimeFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <SelectValue placeholder={timeFilters.find(tf => tf.value === selectedTimeFilter)?.label || "All Time"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {timeFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      {filter.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {selectedTimeFilter === "custom" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Custom Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Report" : "New Report"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, userId: value }))}
                  disabled={!currentAdmin && employees.length === 0}
                >
                  <SelectTrigger className="w-full">
                    {selectedFormEmployeeObject ? (
                      <span className="flex items-center gap-2">
                        {selectedFormEmployeeObject.id === currentAdmin?.id && <User className="w-4 h-4" />}
                        {selectedFormEmployeeObject.name} {selectedFormEmployeeObject.id === currentAdmin?.id ? '(You)' : ''}
                      </span>
                    ) : (
                      <SelectValue placeholder="Select Employee" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {currentAdmin && (
                      <SelectItem value={currentAdmin.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {currentAdmin.name} (You)
                        </div>
                      </SelectItem>
                    )}
                    {employees
                      .filter(emp => emp.id !== currentAdmin?.id)
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Calls</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.totalCalls}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalCalls: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Emails</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.totalEmails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalEmails: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Requirements</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.requirementsReceived}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, requirementsReceived: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Memo Counts</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.memoCounts}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, memoCounts: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Memo Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.memoAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, memoAmount: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sales Count</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.salesCount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, salesCount: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Invoice Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.invoiceAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, invoiceAmount: e.target.value }))
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : isEditing ? "Update Report" : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Performance Analytics Charts */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {selectedEmployees.includes("all") || selectedEmployees.length === 0
                    ? "Performance Over Time" 
                    : `Performance Over Time - ${selectedEmployees.length} employee(s)`}
                </CardTitle>
                <CardDescription>Track calls, emails, and requirements over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {performanceOverTimeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceOverTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={performanceOverTimeData.length > 15 ? Math.floor(performanceOverTimeData.length / 10) : 0}
                          minTickGap={10}
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
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="calls" 
                          name="Calls" 
                          stroke="#3b82f6" 
                          strokeWidth={2.5}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="emails" 
                          name="Emails" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ fill: '#10b981', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="requirements" 
                          name="Requirements" 
                          stroke="#f59e0b" 
                          strokeWidth={2.5}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No performance data available</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance by Employee */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
                <CardDescription>Compare performance metrics across employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {performanceByEmployeeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceByEmployeeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          angle={-30}
                          textAnchor="end"
                          height={70}
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
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar dataKey="calls" name="Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="emails" name="Emails" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="requirements" name="Requirements" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No employee data available</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {report.userId === currentAdmin?.id && <User className="w-4 h-4 text-blue-500" />}
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {report.user?.name || getEmployeeName(report.userId) || "Unknown"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><strong>Calls:</strong> {report.totalCalls}</p>
                          <p><strong>Emails:</strong> {report.totalEmails}</p>
                          <p><strong>Reqs:</strong> {report.requirementsReceived}</p>
                        </div>
                        {report.memo && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <strong>Memo:</strong> {report.memo}
                          </p>
                        )}
                        {report.invoice && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <strong>Invoice:</strong> {report.invoice}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEdit(report)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-8 w-8"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No reports found for the selected filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}