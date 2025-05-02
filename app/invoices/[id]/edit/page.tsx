"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { EditInvoiceForm } from "@/components/invoice/edit-invoice-form";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

type Invoice = {
    id: string;
    invoiceNo: string;
    date: Date;
    dueDate: Date;
    paymentTerms: number;
    shipmentId: string;
    crPayment: number;
    discount: number;
    shipmentCost: number;
    items: {
        color: string;
        description: string;
        carat: number;
        clarity: string;
        lab: string;
        reportNo: string;
        pricePerCarat: number;
        id?: string;
    }[];
    description?: string;
    companyName: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    totalAmount?: number;
    subtotal?: number;
};

export default function EditInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const id = params.id as string;

    useEffect(() => {
        // Check if the user is admin
        if (!userLoading && user && user.role !== 'admin') {
            toast.error("Only admins can edit invoices");
            router.push(`/invoices/${id}`);
            return;
        }

        if (!id) return;

        const fetchInvoice = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/invoices/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to fetch invoice (${response.status})`);
                }
                const data = await response.json();
                if (data.invoice) {
                    // Convert dates from strings to Date objects for the form
                    const processedInvoice = {
                        ...data.invoice,
                        date: new Date(data.invoice.date),
                        dueDate: new Date(data.invoice.dueDate)
                    };
                    setInvoice(processedInvoice);
                } else {
                    throw new Error("Invoice data not found in API response.");
                }
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                toast.error("Failed to load invoice");
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading && user) {
            fetchInvoice();
        }
    }, [id, user, userLoading, router]);

    if (userLoading || loading) {
        return (
            <div className="container py-10 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-10 text-center text-red-600">
                <p>Error loading invoice: {error}</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/invoices">Back to Invoices</Link>
                </Button>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="container py-10 text-center text-muted-foreground">
                <p>Invoice not found.</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/invoices">Back to Invoices</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-10 max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit Invoice {invoice.invoiceNo}</h1>
                <Button 
                    asChild 
                    variant="outline"
                    className="ml-4"
                >
                    <Link href={`/invoices/${id}`}>Cancel</Link>
                </Button>
            </div>
            <EditInvoiceForm invoice={invoice} />
        </div>
    );
}