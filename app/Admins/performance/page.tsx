"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Trash2, User, Filter } from "lucide-react";

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
  const getEmployeeName = (userId) => {
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
      const response = await fetch("/api/auth/me");
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
  const fetchReports = async () => {
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
  };

  useEffect(() => {
    fetchReports();
  }, [selectedEmployee, selectedTimeFilter]);

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

  const handleSubmit = async (e) => {
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

  const handleEdit = (report) => {
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

  const handleDelete = async (id) => {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Performance Reports</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
                <SelectValue placeholder={selectedEmployee === "all" 
                  ? "All Employees" 
                  : getEmployeeName(selectedEmployee)} />
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
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">
              {isEditing ? "Edit Report" : "New Report"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={getEmployeeName(formData.userId)} />
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
                  value={formData.totalCalls}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalCalls: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Emails</label>
                <Input
                  type="number"
                  value={formData.totalEmails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalEmails: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Requirements Received</label>
                <Input
                  type="number"
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
                  placeholder="Enter memo number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <Input
                  type="text"
                  value={formData.invoice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invoice: e.target.value }))}
                  placeholder="Enter invoice number"
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
          </Card>

          {/* Reports List */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">All Reports</h2>
            <div className="space-y-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white p-4 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {report.userId === currentAdmin?.id && <User className="w-4 h-4" />}
                          <p className="font-medium">
                            {report.user?.name || getEmployeeName(report.userId) || "Unknown Employee"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Calls:</strong> {report.totalCalls}
                        </p>
                        <p>
                          <strong>Emails:</strong> {report.totalEmails}
                        </p>
                        <p>
                          <strong>Requirements:</strong> {report.requirementsReceived}
                        </p>
                        {report.memo && (
                          <p className="text-sm text-gray-600">
                            <strong>Memo Number:</strong> {report.memo}
                          </p>
                        )}
                        {report.invoice && (
                          <p className="text-sm text-gray-600">
                            <strong>Invoice Number:</strong> {report.invoice}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(report)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
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
                  No reports found
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}