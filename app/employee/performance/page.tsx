"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit2, Trash2 } from "lucide-react";

interface Report {
  id: string;
  date: string;
  totalCalls: number;
  totalEmails: number;
  requirementsReceived: number;
  memo?: string;
  invoice?: string;
}

export default function EmployeePerformance() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formData, setFormData] = useState({
    totalCalls: "",
    totalEmails: "",
    requirementsReceived: "",
    memo: "",
    invoice: "",
  });

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/performance");
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/performance/${editingId}` : "/api/performance";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
        });
        setIsEditing(false);
        setEditingId("");
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
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this report?")) {
      try {
        const response = await fetch(`/api/performance/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Report deleted successfully");
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
        <h1 className="text-3xl font-bold mb-8">Performance Report</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Form */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">
              {isEditing ? "Edit Report" : "New Report"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">Memo</label>
                <Textarea
                  value={formData.memo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                  placeholder="Add any notes about memos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Invoice</label>
                <Textarea
                  value={formData.invoice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invoice: e.target.value }))}
                  placeholder="Add any notes about invoices..."
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
            <h2 className="text-2xl font-bold mb-6">Your Reports</h2>
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
                  {report.memo && (
                    <p className="text-sm text-gray-600">
                      <strong>Memo:</strong> {report.memo}
                    </p>
                  )}
                  {report.invoice && (
                    <p className="text-sm text-gray-600">
                      <strong>Invoice:</strong> {report.invoice}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}