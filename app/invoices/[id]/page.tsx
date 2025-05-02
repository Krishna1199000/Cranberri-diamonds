"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { InvoiceFormValues } from "@/lib/validators/invoice"; // Use the form type for structure
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

// Define the structure of the fetched invoice data (matching API response)
type FetchedInvoice = InvoiceFormValues & {
    id: string;
    createdAt: string; // Or Date if API returns Date objects
    updatedAt: string; // Or Date if API returns Date objects
    // Add user if included from API, e.g.:
    // user?: { id: string; name: string; email: string };
};

export default function ViewInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string; // Get ID from URL
    const [invoice, setInvoice] = useState<FetchedInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoading: userLoading } = useUser();

    useEffect(() => {
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
                    // Coerce date strings back to Date objects for the preview component if needed
                    // The preview component currently expects strings/numbers based on InvoiceFormValues
                    // but handles date display itself using format(new Date(...)).
                    // So, direct assignment should be okay here.
                    setInvoice(data.invoice);
                } else {
                     throw new Error("Invoice data not found in API response.");
                }
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id]);

    if (loading || userLoading) {
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
           {/* Pass the fetched invoice data (as InvoiceFormValues structure) */}
           {/* The Preview component handles its own layout/styling */}
           <InvoicePreview invoice={invoice} />
           <div className="mt-6 flex justify-center space-x-4 print:hidden">
                {user?.role === 'admin' && (
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => router.push(`/invoices/${id}/edit`)}
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Invoice
                    </Button>
                )}
                <Button asChild variant="outline">
                    <Link href="/invoices">Back to Invoices List</Link>
                </Button>
           </div>
        </div>
    );
}