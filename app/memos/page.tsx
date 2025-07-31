"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define session user type (reusable or import if shared)
interface SessionUser {
    id: string;
    role: 'admin' | 'employee' | 'customer';
    name?: string;
}

// Define Memo type (matching the expected API response)
interface Memo {
  id: string;
  memoNo: string; // Renamed from invoiceNo
  date: string;
  dueDate: string;
  companyName: string;
  totalAmount: number;
  createdAt: string;
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]); // Renamed state
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<SessionUser['role'] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user role (remains the same)
        const userResponse = await fetch("/api/auth/me", { credentials: 'include' });
        if (userResponse.ok) {
          const userData: SessionUser = await userResponse.json();
          setUserRole(userData.role);
        } else {
          toast.error("Failed to verify user role.");
          setUserRole(null);
        }

        // Fetch memos using the new endpoint
        const response = await fetch("/api/memos"); // Updated API endpoint
        const data = await response.json();
        
        if (data.memos) { // Access data.memos
          setMemos(data.memos);
        }
      } catch (error) {
        console.error("Failed to fetch memos:", error);
        toast.error("Failed to load memos."); // Updated message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (memoId: string) => { // Use memoId
    if (!window.confirm("Are you sure you want to delete this memo? This action cannot be undone.")) { // Updated confirmation
        return;
    }
    
    setDeletingId(memoId);
    
    try {
        const response = await fetch(`/api/memos/${memoId}`, { // Updated API endpoint
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete memo'); // Updated message
        }

        setMemos(currentMemos => 
            currentMemos.filter(memo => memo.id !== memoId) // Update state correctly
        );
        toast.success("Memo deleted successfully"); // Updated message

    } catch (error) {
        console.error("Error deleting memo:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete memo'); // Updated message
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Memos</h1> {/* Updated Title */}
        <Link href="/memos/new"> {/* Updated Link */}
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Memo {/* Updated Button Text */}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : memos.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
              <CardTitle>No Memos Yet</CardTitle> {/* Updated Title */}
              <CardDescription>Ready to create your first memo?</CardDescription> {/* Updated Description */}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
            <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
            <Link href="/memos/new"> {/* Updated Link */}
              <Button>Create Memo</Button> {/* Updated Button Text */}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {memos.map((memo) => ( // Use memo
            <Card key={memo.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-primary">{memo.memoNo}</h3> {/* Use memoNo */}
                      <span className="text-lg font-medium">{formatCurrency(memo.totalAmount)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{memo.companyName}</p>
                    <div className="text-xs text-muted-foreground">
                         <p>Created: {new Date(memo.createdAt).toLocaleDateString()}</p>
                         <p>Due: {new Date(memo.dueDate).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                  <Link href={`/memos/${memo.id}`}> {/* Updated Link */}
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  {/* Conditionally render Delete Button only for admins */}
                  {userRole === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(memo.id)}
                      disabled={deletingId === memo.id}
                      aria-label="Delete memo" // Updated Aria Label
                      className="flex items-center"
                    >
                      {deletingId === memo.id ? (
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