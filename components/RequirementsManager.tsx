"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface Requirement {
  id: string;
  customerName: string;
  description: string;
  state: string;
  country: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface RequirementsManagerProps {
  userRole: 'admin' | 'employee';
  currentUserId: string;
}

export function RequirementsManager({ userRole, currentUserId }: RequirementsManagerProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    description: '',
    state: '',
    country: ''
  });



  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/requirements', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setRequirements(data.requirements);
      } else {
        toast.error('Failed to fetch requirements');
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to fetch requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userRole !== 'employee') {
      toast.error('Only employees can create requirements');
      return;
    }

    if (creating) return; // Prevent double submission

    setCreating(true);
    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Requirement created successfully');
        setFormData({ customerName: '', description: '', state: '', country: '' });
        setIsCreateDialogOpen(false);
        // Add new requirement to the list instead of fetching all
        setRequirements(prev => [data.requirement, ...prev]);
      } else {
        toast.error(data.message || 'Failed to create requirement');
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast.error('Failed to create requirement');
    } finally {
      setCreating(false);
    }
  };

  const handleEditRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRequirement || updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/requirements/${editingRequirement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Requirement updated successfully');
        setIsEditDialogOpen(false);
        setEditingRequirement(null);
        setFormData({ customerName: '', description: '', state: '', country: '' });
        // Update the specific requirement in the list
        setRequirements(prev => prev.map(req => 
          req.id === editingRequirement.id ? data.requirement : req
        ));
      } else {
        toast.error(data.message || 'Failed to update requirement');
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast.error('Failed to update requirement');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return;

    if (deleting === id) return; // Prevent double clicking

    setDeleting(id);
    try {
      const response = await fetch(`/api/requirements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Requirement deleted successfully');
        // Remove the requirement from the list instead of fetching all
        setRequirements(prev => prev.filter(req => req.id !== id));
      } else {
        toast.error(data.message || 'Failed to delete requirement');
      }
    } catch (error) {
      console.error('Error deleting requirement:', error);
      toast.error('Failed to delete requirement');
    } finally {
      setDeleting(null);
    }
  };

  const handleCompleteRequirement = async (id: string) => {
    if (userRole !== 'admin') {
      toast.error('Only admins can mark requirements as completed');
      return;
    }

    if (completing === id) return; // Prevent double clicking

    setCompleting(id);
    try {
      const response = await fetch(`/api/requirements/${id}/complete`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Requirement marked as completed');
        // Update the specific requirement in the list instead of fetching all
        setRequirements(prev => prev.map(req => 
          req.id === id ? { ...req, isCompleted: true } : req
        ));
      } else {
        toast.error(data.message || 'Failed to mark requirement as completed');
      }
    } catch (error) {
      console.error('Error completing requirement:', error);
      toast.error('Failed to mark requirement as completed');
    } finally {
      setCompleting(null);
    }
  };

  const openEditDialog = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setFormData({
      customerName: requirement.customerName,
      description: requirement.description,
      state: requirement.state,
      country: requirement.country || ''
    });
    setIsEditDialogOpen(true);
  };

  const canEdit = (requirement: Requirement) => {
    return userRole === 'admin' || (userRole === 'employee' && requirement.employee.id === currentUserId);
  };

  const canDelete = (requirement: Requirement) => {
    return userRole === 'admin' || (userRole === 'employee' && requirement.employee.id === currentUserId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Requirements Management
            </CardTitle>
            {userRole === 'employee' && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Requirement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateRequirement} className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Enter state"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Enter country"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={creating}>
                      {creating ? 'Creating Requirement...' : 'Create Requirement'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading requirements...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No requirements found
                    </TableCell>
                  </TableRow>
                ) : (
                  requirements.map((requirement) => (
                    <TableRow key={requirement.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          {requirement.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={requirement.description}>
                          {requirement.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {requirement.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {requirement.country || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{requirement.employee.name}</TableCell>
                      <TableCell>
                        <Badge variant={requirement.isCompleted ? "default" : "secondary"}>
                          {requirement.isCompleted ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </div>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(requirement.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!requirement.isCompleted && userRole === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteRequirement(requirement.id)}
                              className="text-green-600 hover:text-green-700"
                              disabled={completing === requirement.id}
                            >
                              {completing === requirement.id ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {canEdit(requirement) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(requirement)}
                              disabled={updating || completing === requirement.id || deleting === requirement.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete(requirement) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRequirement(requirement.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={deleting === requirement.id}
                            >
                              {deleting === requirement.id ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Requirement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditRequirement} className="space-y-4">
            <div>
              <Label htmlFor="editCustomerName">Customer Name</Label>
              <Input
                id="editCustomerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="editState">State</Label>
              <Input
                id="editState"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Enter state"
                required
              />
            </div>
            <div>
              <Label htmlFor="editCountry">Country</Label>
              <Input
                id="editCountry"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter country"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={updating}>
              {updating ? 'Updating Requirement...' : 'Update Requirement'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 