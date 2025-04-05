"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Trash2, User } from "lucide-react";

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

  const fetchCurrentAdmin = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.success) {
        setCurrentAdmin(data.user);
        setEmployees(prev => [...prev, data.user]); // Add admin to employees list
      }
    } catch (error) {
      console.error("Error fetching current admin:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const url = selectedEmployee === "all" 
          ? "/api/performance/admin"
          : `/api/performance/admin?employeeId=${selectedEmployee}`;
        
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          setReports(data.reports);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to fetch reports");
      }
    };
  
    fetchReports();
  }, [selectedEmployee]);

  useEffect(() => {
    fetchEmployees();
    fetchCurrentAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `/api/performance/admin/${editingId}` 
        : "/api/performance/admin";

      // If no user is selected, use current admin's ID
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
          userId: "",
        });
        setIsEditing(false);
        setEditingId("");
        
        // Refresh reports
        const reportsUrl = selectedEmployee === "all" 
          ? "/api/performance/admin"
          : `/api/performance/admin?employeeId=${selectedEmployee}`;
        
        const reportsResponse = await fetch(reportsUrl);
        const reportsData = await reportsResponse.json();
        if (reportsData.success) {
          setReports(reportsData.reports);
        }
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
          const url = selectedEmployee === "all" 
            ? "/api/performance/admin"
            : `/api/performance/admin?employeeId=${selectedEmployee}`;
          
          const reportsResponse = await fetch(url);
          const data = await reportsResponse.json();
          if (data.success) {
            setReports(data.reports);
          }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Performance Reports</h1>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center gap-2">
                    {employee.id === currentAdmin?.id && <User className="w-4 h-4" />}
                    {employee.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    <SelectValue placeholder="Select Employee" />
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
              {reports.map((report) => (
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
                        <p className="font-medium">{report.user.name}</p>
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
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}