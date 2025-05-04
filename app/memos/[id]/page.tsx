"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MemoPreview } from "@/components/memo/memo-preview";
import { InvoiceFormValues } from "@/lib/validators/invoice";
type MemoFormValues = InvoiceFormValues;
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

type FetchedMemo = MemoFormValues & {
    id: string;
    memoNo: string;
    createdAt: string; 
    updatedAt: string; 
};

export default function ViewMemoPage() {
    const params = useParams();
    const id = params.id as string;
    const [memo, setMemo] = useState<FetchedMemo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoading: userLoading } = useUser();

    useEffect(() => {
        if (!id) return;

        const fetchMemo = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/memos/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to fetch memo (${response.status})`);
                }
                const data = await response.json();
                if (data.memo) {
                    setMemo(data.memo);
                } else {
                     throw new Error("Memo data not found in API response.");
                }
            } catch (err) {
                console.error("Error fetching memo:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchMemo();
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
                <p>Error loading memo: {error}</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/memos">Back to Memos</Link>
                </Button>
            </div>
        );
    }

    if (!memo) {
         return (
            <div className="container py-10 text-center text-muted-foreground">
                <p>Memo not found.</p>
                 <Button asChild variant="outline" className="mt-4">
                    <Link href="/memos">Back to Memos</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-10 max-w-6xl">
           <MemoPreview memo={memo} />
           <div className="mt-6 flex justify-center space-x-4 print:hidden">
                {user?.role === 'admin' && (
                    <Button 
                        asChild
                        variant="outline" 
                        className="flex items-center gap-2"
                    >
                        <Link href={`/memos/${id}/edit`}>
                           <Pencil className="h-4 w-4" />
                            Edit Memo
                        </Link>
                    </Button>
                )}
                <Button asChild variant="outline">
                    <Link href="/memos">Back to Memos List</Link>
                </Button>
           </div>
        </div>
    );
} 