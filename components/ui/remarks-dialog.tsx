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

  const fetchRemarks = useCallback(async () => {
    try {
      const res = await fetch(`/api/remarks?shipmentId=${shipmentId}`, {
        credentials: 'include' // Add credentials to include cookies
      });
      const data = await res.json();
      if (data.success) {
        setRemarks(data.remarks);
      }
    } catch (error: unknown) {
      toast.error(`Failed to fetch remarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [shipmentId]);
  
  useEffect(() => {
    if (isOpen) {
      fetchRemarks();
    }
  }, [isOpen, fetchRemarks]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    try {
      const res = await fetch('/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newRemark, shipmentId }),
        credentials: 'include' // Add credentials to include cookies
      });

      const data = await res.json();
      if (data.success) {
        setNewRemark('');
        fetchRemarks();
        toast.success('Remark added successfully');
      } else {
        // Handle error response from API
        toast.error(data.message || 'Failed to add remark');
      }
    } catch (error: unknown) {
      toast.error(`Failed to add remark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = async () => {
    if (!editingRemark) return;

    try {
      const res = await fetch(`/api/remarks/${editingRemark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingRemark.content }),
        credentials: 'include' // Add credentials to include cookies
      });

      const data = await res.json();
      if (data.success) {
        setEditingRemark(null);
        fetchRemarks();
        toast.success('Remark updated successfully');
      } else {
        toast.error(data.message || 'Failed to update remark');
      }
    } catch (error: unknown) {
      toast.error(`Failed to update remark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this remark?')) return;

    try {
      const res = await fetch(`/api/remarks/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Add credentials to include cookies
      });

      const data = await res.json();
      if (data.success) {
        fetchRemarks();
        toast.success('Remark deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete remark');
      }
    } catch (error: unknown) {
      toast.error(`Failed to delete remark: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            />
            <Button type="submit">Add</Button>
          </form>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {remarks.length > 0 ? (
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
                      />
                      <Button onClick={handleEdit}>Save</Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingRemark(null)}
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
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(remark.id)}
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