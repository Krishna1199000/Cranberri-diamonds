"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices");
        const data = await response.json();
        
        if (data.invoices) {
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Invoice
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No invoices found</p>
            <Link href="/invoices/new">
              <Button>Create your first invoice</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{invoice.invoiceNo}</h3>
                    <p className="text-muted-foreground">{invoice.companyName}</p>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}