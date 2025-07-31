"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define session user type (adjust based on actual session structure)
interface SessionUser {
    id: string;
    role: 'admin' | 'employee' | 'customer'; // Add other roles as needed
    name?: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  companyName: string;
  totalAmount: number;
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<SessionUser['role'] | null>(null); // State to store user role

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user role first
        const userResponse = await fetch("/api/auth/me", { credentials: 'include' });
        if (userResponse.ok) {
          const userData: SessionUser = await userResponse.json();
          setUserRole(userData.role);
        } else {
          // Handle error fetching user, maybe redirect or show error
          toast.error("Failed to verify user role.");
          setUserRole(null); // Or handle appropriately
          // Consider redirecting: window.location.href = '/auth/signin';
        }

        // Fetch invoices (API now handles filtering based on role)
        const response = await fetch("/api/invoices");
        const data = await response.json();
        
        if (data.invoices) {
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
        toast.error("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

        setInvoices(currentInvoices => 
            currentInvoices.filter(invoice => invoice.id !== invoiceId)
        );
        toast.success("Invoice deleted successfully");

    } catch (error) {
        console.error("Error deleting invoice:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete invoice');
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Invoices</h1>
        <Link href="/invoices/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Invoice
          </Button>
        </Link>
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
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-primary">{invoice.invoiceNo}</h3>
                      <span className="text-lg font-medium">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{invoice.companyName}</p>
                    <div className="text-xs text-muted-foreground">
                         <p>Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                         <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  {/* Conditionally render Delete Button only for admins */}
                  {userRole === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invoice.id)}
                      disabled={deletingId === invoice.id}
                      aria-label="Delete invoice"
                      className="flex items-center"
                    >
                      {deletingId === invoice.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" /> 
                      )}
                       Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}