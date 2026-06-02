"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MemoPreview } from "@/components/memo/memo-preview";
import { InvoiceFormValues } from "@/lib/validators/invoice";
type MemoFormValues = InvoiceFormValues;
import { Loader2, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

type FetchedMemo = MemoFormValues & {
    id: string;
    memoNo: string;
    createdAt: string;
    updatedAt: string;
    memoStatus: 'ACTIVE' | 'RETURNED' | 'DISMISSED';
    memoTerms: number;
    returnDate?: string | null;
    processedBy?: string | null;
};

export default function ViewMemoPage() {
    const params = useParams();
    const id = params.id as string;
    const [memo, setMemo] = useState<FetchedMemo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingMemoStatus, setUpdatingMemoStatus] = useState(false);
    const { user, isLoading: userLoading } = useUser();

    const isReturned = memo?.memoStatus === 'RETURNED';

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

    const handleMemoStatusUpdate = async (
        newStatus: 'ACTIVE' | 'RETURNED' | 'DISMISSED',
        options?: { revertReturn?: boolean }
    ) => {
        if (!memo) return;
        if (isReturned && !(options?.revertReturn && newStatus === 'ACTIVE')) return;

        setUpdatingMemoStatus(true);
        try {
            const response = await fetch(`/api/memos/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    memoStatus: newStatus,
                    ...(options?.revertReturn ? { revertReturn: true } : {}),
                }),
            });

            const result = await response.json();

            if (result.success) {
                setMemo(prev => prev ? { ...prev, ...result.memo, memoStatus: newStatus } : null);
                toast.success(result.message);
            } else {
                toast.error(result.message || 'Failed to update memo status');
            }
        } catch (error) {
            console.error('Error updating memo status:', error);
            toast.error('Failed to update memo status');
        } finally {
            setUpdatingMemoStatus(false);
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'RETURNED': return 'success';
            case 'DISMISSED': return 'secondary';
            case 'ACTIVE': return 'warning';
            default: return 'default';
        }
    };

    const getStatusDisplayName = (status: string) => {
        switch (status) {
            case 'RETURNED': return 'Returned';
            case 'DISMISSED': return 'Dismissed';
            case 'ACTIVE': return 'Active';
            default: return status;
        }
    };

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
        <div className="container py-10 max-w-6xl print:py-0 print:max-w-none print:px-0">
           {user?.role === 'admin' && (
               <Card className="mb-6 print:hidden">
                   <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                           <FileText className="h-5 w-5" />
                           Memo Status
                       </CardTitle>
                   </CardHeader>
                   <CardContent>
                       <div className="flex items-center justify-between flex-wrap gap-4">
                           <div className="flex items-center gap-4">
                               <span className="text-sm font-medium">Current Status:</span>
                               <Badge variant={getStatusBadgeVariant(memo.memoStatus)}>
                                   {getStatusDisplayName(memo.memoStatus)}
                               </Badge>
                           </div>
                           {!isReturned && (
                             <div className="flex items-center gap-2">
                                 <span className="text-sm font-medium">Update to:</span>
                                 <Select
                                     value={memo.memoStatus}
                                     onValueChange={(value) => {
                                       void handleMemoStatusUpdate(value as 'ACTIVE' | 'RETURNED' | 'DISMISSED');
                                     }}
                                     disabled={updatingMemoStatus}
                                 >
                                     <SelectTrigger className="w-48">
                                         <SelectValue placeholder="Status" />
                                     </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="ACTIVE">Active</SelectItem>
                                         <SelectItem value="RETURNED">Returned</SelectItem>
                                         <SelectItem value="DISMISSED">Dismissed</SelectItem>
                                     </SelectContent>
                                 </Select>
                                 {updatingMemoStatus && (
                                     <Loader2 className="h-4 w-4 animate-spin" />
                                 )}
                             </div>
                           )}
                       </div>
                       {isReturned && (
                         <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm space-y-2">
                           <p className="font-medium text-green-800">Returned memo</p>
                           {memo.returnDate && (
                             <p>
                               <strong>Return date:</strong>{' '}
                               {new Date(memo.returnDate).toLocaleString()}
                             </p>
                           )}
                           {memo.processedBy && (
                             <p><strong>Processed by:</strong> {memo.processedBy}</p>
                           )}
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             disabled={updatingMemoStatus}
                             onClick={() => void handleMemoStatusUpdate('ACTIVE', { revertReturn: true })}
                           >
                             {updatingMemoStatus ? (
                               <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             ) : null}
                             Restore to Active (undo return)
                           </Button>
                         </div>
                       )}
                       {!isReturned && (
                         <div className="text-xs text-muted-foreground mt-2 space-y-1">
                             <p><strong>Active:</strong> Memo is out with client; overdue alerts apply after {memo.memoTerms || 30} days.</p>
                             <p><strong>Returned:</strong> Use &quot;Mark as Returned&quot; on the list or select Returned here.</p>
                             <p><strong>Dismissed:</strong> Administratively closed; notifications disabled.</p>
                         </div>
                       )}
                   </CardContent>
               </Card>
           )}

           <MemoPreview memo={memo} />
           <div className="mt-6 flex justify-center space-x-4 print:hidden">
                {user?.role === 'admin' && !isReturned && (
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
