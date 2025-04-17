"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Remark {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface RemarksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  userRole: string;
}

export function RemarksDialog({ isOpen, onClose, shipmentId, userRole }: RemarksDialogProps) {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [editingRemark, setEditingRemark] = useState<{ id: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRemarks = useCallback(async () => {
    if (!shipmentId) return;
    
    try {
      setIsLoading(true);
      const res = await fetch(`/api/remarks?shipmentId=${shipmentId}`, {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch remarks');
      }
      
      const data = await res.json();
      if (data.success) {
        setRemarks(data.remarks);
      }
    } catch (error: unknown) {
      toast.error(`Failed to fetch remarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId]);
  
  useEffect(() => {
    if (isOpen && shipmentId) {
      fetchRemarks();
    }
  }, [isOpen, fetchRemarks, shipmentId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim() || !shipmentId) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/remarks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: newRemark, 
          shipmentId 
        }),
        credentials: 'include', // Important: this sends the cookies with the request
      });

      if (!res.ok) {
        // Get the actual error message from the response
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setNewRemark('');
        fetchRemarks();
        toast.success('Remark added successfully');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add remark: ${errorMessage}`);
      
      // If it's an authentication error, you might want to redirect to login
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        toast.error('You need to be logged in to add remarks');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingRemark) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/remarks/${editingRemark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingRemark.content }),
        credentials: 'include', // Important: this sends the cookies with the request
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setEditingRemark(null);
        fetchRemarks();
        toast.success('Remark updated successfully');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update remark: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this remark?')) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/remarks/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Important: this sends the cookies with the request
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        fetchRemarks();
        toast.success('Remark deleted successfully');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete remark: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Remarks</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="Add a remark..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !newRemark.trim()}>
              {isLoading ? 'Adding...' : 'Add'}
            </Button>
          </form>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading && remarks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Loading remarks...
              </div>
            ) : remarks.length > 0 ? (
              remarks.map((remark) => (
                <div
                  key={remark.id}
                  className="bg-gray-50 p-4 rounded-lg space-y-2"
                >
                  {editingRemark?.id === remark.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingRemark.content}
                        onChange={(e) =>
                          setEditingRemark({ ...editingRemark, content: e.target.value })
                        }
                        className="flex-1"
                        disabled={isLoading}
                      />
                      <Button onClick={handleEdit} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingRemark(null)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p>{remark.content}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div>
                          <span className="font-medium">{remark.user.name}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(remark.createdAt).toLocaleString()}</span>
                        </div>
                        {(userRole === 'admin' || remark.user.role === userRole) && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingRemark({
                                  id: remark.id,
                                  content: remark.content,
                                })
                              }
                              disabled={isLoading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(remark.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No remarks yet. Add the first one!
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}