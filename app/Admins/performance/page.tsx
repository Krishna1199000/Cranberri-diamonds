"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Trash2, User, Filter } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Link from "next/link";

export default function AdminPerformance() {
  interface Employee {
    id: string;
    name: string;
  }

  interface Report {
    id: string;
    totalCalls: number;
    totalEmails: number;
    requirementsReceived: number;
    memo: string;
    invoice: string;
    userId: string;
    date: string;
    user: {
      name: string;
    };
  }
  
  const [reports, setReports] = useState<Report[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    totalCalls: "",
    totalEmails: "",
    requirementsReceived: "",
    memo: "",
    invoice: "",
    userId: "",
  });

  // Time filter options
  const timeFilters = [
    { value: "all", label: "All Time" },
    { value: "24hours", label: "Last 24 Hours" },
    { value: "7days", label: "Last 7 Days" },
    { value: "monthly", label: "This Month" },
    { value: "yearly", label: "This Year" }
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
        
        // Add employee filter if specific employee is selected
        if (selectedEmployee !== "all") {
          url += `employeeId=${selectedEmployee}&`;
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
          setReports(data.reports);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to fetch reports");
      }
    }, [selectedEmployee, selectedTimeFilter]);

  // Find the selected employee object for the FILTER dropdown
  const selectedFilterEmployeeObject = employees.find(emp => emp.id === selectedEmployee);

  // Find the selected employee object for the FORM dropdown
  const selectedFormEmployeeObject = employees.find(emp => emp.id === formData.userId);

  useEffect(() => {
    fetchReports();
  }, [selectedEmployee, selectedTimeFilter, fetchReports]);

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
          memo: "",
          invoice: "",
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
      requirementsReceived: report.requirementsReceived.toString(),
      memo: report.memo || "",
      invoice: report.invoice || "",
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

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Performance Reports</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/Admins/sales">
            <Button variant="outline">Back to Sales</Button>
          </Link>
          {/* Time Period Filter */}
          <Select value={selectedTimeFilter} onValueChange={setSelectedTimeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={timeFilters.find(tf => tf.value === selectedTimeFilter)?.label || "All Time"} />
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
          
          {/* Employee Filter */}
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full sm:w-[200px]">
              {selectedFilterEmployeeObject && selectedFilterEmployeeObject.id !== "all" ? (
                selectedFilterEmployeeObject.name
              ) : (
                <SelectValue placeholder="All Employees" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
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
                <label className="block text-sm font-medium mb-1">Requirements Received</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.requirementsReceived}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requirementsReceived: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Memo Number</label>
                <Input
                  type="text"
                  value={formData.memo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                  placeholder="Enter memo number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <Input
                  type="text"
                  value={formData.invoice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invoice: e.target.value }))}
                  placeholder="Enter invoice number (optional)"
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