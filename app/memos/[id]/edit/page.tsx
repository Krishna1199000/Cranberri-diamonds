"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MemoForm } from "@/components/memo/memo-form"; // Import the form
import { MemoFormValues } from "@/lib/validators/memo";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define the structure of the fetched memo data, including items
type FetchedMemoData = MemoFormValues & {
    id: string;
    memoNo: string;
    // Add any other fields fetched from the API that aren't in MemoFormValues
    // (like createdAt, updatedAt if needed, but not directly used by form)
};

export default function EditMemoPage() {
    const params = useParams();
    const id = params.id as string;
    const [memoData, setMemoData] = useState<FetchedMemoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchMemo = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch the specific memo using its ID from the GET route
                const response = await fetch(`/api/memos/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                         throw new Error("Memo not found.");
                    } else if (response.status === 403) {
                         throw new Error("You don't have permission to view this memo.");
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to fetch memo (${response.status})`);
                }
                const data = await response.json();
                if (data.memo) {
                    // Convert date strings back to Date objects for the form
                    const memoWithDates = {
                        ...data.memo,
                        date: new Date(data.memo.date),
                        dueDate: new Date(data.memo.dueDate),
                    };
                    setMemoData(memoWithDates);
                } else {
                    throw new Error("Memo data not found in API response.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchMemo();
    }, [id]);

    if (loading) {
        return (
            <div className="container py-10 max-w-6xl">
                <div className="flex justify-center items-center">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-10 max-w-6xl">
                <div className="flex justify-center items-center">
                    <p className="text-red-500">{error}</p>
                </div>
                <div className="flex justify-center items-center mt-4">
                    <Button asChild>
                        <Link href="/memos">
                            Back to Memos
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-10 max-w-6xl">
            {/* Pass the fetched data to the form */}
            <MemoForm initialData={memoData} />
        </div>
    );
} 