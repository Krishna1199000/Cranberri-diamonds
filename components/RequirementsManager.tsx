"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequirementCreateDialog } from "@/components/requirements/RequirementCreateDialog";
import { RequirementEntryForm } from "@/components/requirements/RequirementEntryForm";
import { defaultRequirementSpec, parseRequirementDescription, type RequirementSpec } from "@/lib/requirements/types";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  Users,
  ChevronDown,
  Filter,
  Plus,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface Requirement {
  id: string;
  customerName: string;
  description: string;
  summary?: string;
  personName?: string;
  state: string;
  country: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  date?: string;
  requirementDate?: string;
  phoneNumber?: string;
  email?: string;
  notes?: string | null;
  budget?: number | null;
  spec?: RequirementSpec | null;
  specs?: RequirementSpec[] | null;
  isLegacy?: boolean;
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
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedByName, setLoggedByName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  
  // Filter states
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  
  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/requirements', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.requirements)) {
        setAllRequirements(data.requirements);
        // Extract unique employees and states
        const uniqueEmployees = new Map<string, { id: string; name: string }>();
        const uniqueStates = new Set<string>();
        
        data.requirements.forEach((req: Requirement) => {
          if (req.employee) {
            uniqueEmployees.set(req.employee.id, {
              id: req.employee.id,
              name: req.employee.name
            });
          }
          if (req.state) {
            uniqueStates.add(req.state);
          }
        });
        
        setAvailableEmployees(Array.from(uniqueEmployees.values()));
        setAvailableStates(Array.from(uniqueStates).sort());
        
        // Apply filters
        applyFilters(data.requirements);
      } else {
        toast.error(data.message || 'Failed to fetch requirements');
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to fetch requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.ok) {
          const user = await response.json();
          setLoggedByName(user.name || user.email || "");
        }
      } catch {
        /* ignore */
      }
    };
    loadUser();
  }, []);

  const handleEditRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRequirement || updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/requirements/${editingRequirement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editFormData.customerName,
          personName: editFormData.personName,
          state: editFormData.state,
          country: editFormData.country,
          phoneNumber: editFormData.phoneNumber,
          email: editFormData.email,
          requirementDate: editFormData.requirementDate,
          notes: editFormData.notes,
          budget: editFormData.budget,
          specs: editFormData.isLegacy ? undefined : editFormData.specs,
          description: editFormData.isLegacy ? editFormData.legacyDescription : undefined,
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Requirement updated successfully');
        setIsEditDialogOpen(false);
        setEditingRequirement(null);
        resetEditForm();
        setAllRequirements((prev) =>
          prev.map((req) => (req.id === editingRequirement.id ? data.requirement : req))
        );
        setRequirements((prev) =>
          prev.map((req) => (req.id === editingRequirement.id ? data.requirement : req))
        );
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

  const resetEditForm = () => {
    setEditFormData({
      customerName: '',
      personName: '',
      state: '',
      country: '',
      phoneNumber: '',
      email: '',
      requirementDate: new Date().toISOString().split('T')[0],
      notes: '',
      budget: '',
      specs: [defaultRequirementSpec()],
      isLegacy: false,
      legacyDescription: '',
    });
  };

  const [editFormData, setEditFormData] = useState({
    customerName: '',
    personName: '',
    state: '',
    country: '',
    phoneNumber: '',
    email: '',
    requirementDate: new Date().toISOString().split('T')[0],
    notes: '',
    budget: '' as string | number,
    specs: [defaultRequirementSpec()] as RequirementSpec[],
    isLegacy: false,
    legacyDescription: '',
  });

  const openEditDialog = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    const reqDate = requirement.requirementDate || requirement.date
      ? new Date(requirement.requirementDate || requirement.date!).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const parsed = parseRequirementDescription(requirement.description);
    const isLegacy = requirement.isLegacy ?? (!parsed.specs && !parsed.spec);
    const specsToEdit = requirement.specs ||
      ((parsed.specs ?? (parsed.spec ? [parsed.spec] : null)) ??
      [defaultRequirementSpec()]);
    setEditFormData({
      customerName: requirement.customerName,
      personName: requirement.personName || '',
      state: requirement.state,
      country: requirement.country || '',
      phoneNumber: requirement.phoneNumber || '',
      email: requirement.email || '',
      requirementDate: reqDate,
      notes: requirement.notes || '',
      budget: requirement.budget ?? '',
      specs: specsToEdit,
      isLegacy,
      legacyDescription: isLegacy ? requirement.description : '',
    });
    setIsEditDialogOpen(true);
  };

  const canEdit = (requirement: Requirement) => {
    return userRole === 'admin' || (userRole === 'employee' && requirement.employee.id === currentUserId);
  };

  const canDelete = (requirement: Requirement) => {
    return userRole === 'admin' || (userRole === 'employee' && requirement.employee.id === currentUserId);
  };

  // Chart data calculations
  const requirementsOverTimeData = useMemo(() => {
    if (!requirements || requirements.length === 0) {
      return [];
    }
    
    const grouped: Record<string, { date: string; count: number; timestamp: number }> = {};
    
    requirements.forEach(req => {
      const dateObj = new Date(req.createdAt);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const dateKey = dateObj.toISOString().split('T')[0];
      
      if (grouped[dateKey]) {
        grouped[dateKey].count += 1;
      } else {
        grouped[dateKey] = {
          date: dateStr,
          count: 1,
          timestamp: dateObj.getTime()
        };
      }
    });
    
    const result = Object.keys(grouped).map(key => ({
      date: grouped[key].date,
      count: grouped[key].count,
      timestamp: grouped[key].timestamp
    }));
    
    result.sort((a, b) => a.timestamp - b.timestamp);
    
    return result.map(({ date, count }) => ({ date, count }));
  }, [requirements]);

  // Apply filters function
  const applyFilters = (data: Requirement[]) => {
    let filtered = [...data];
    
    // Filter by employees
    if (selectedEmployees.length > 0) {
      filtered = filtered.filter(req => selectedEmployees.includes(req.employee.id));
    }
    
    // Filter by states
    if (selectedStates.length > 0) {
      filtered = filtered.filter(req => selectedStates.includes(req.state));
    }
    
    // Filter by statuses
    if (selectedStatuses.length > 0) {
      if (selectedStatuses.includes('completed') && !selectedStatuses.includes('pending')) {
        filtered = filtered.filter(req => req.isCompleted);
      } else if (selectedStatuses.includes('pending') && !selectedStatuses.includes('completed')) {
        filtered = filtered.filter(req => !req.isCompleted);
      }
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(req => {
        const reqDate = new Date(req.createdAt);
        return reqDate >= startDate && reqDate <= endDate;
      });
    }
    
    setRequirements(filtered);
  };

  // Apply filters when filter states change
  useEffect(() => {
    if (allRequirements.length > 0) {
      applyFilters(allRequirements);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployees, selectedStates, selectedStatuses, dateRange, allRequirements]);

  const requirementsByStatusData = useMemo(() => {
    const completed = requirements.filter(r => r.isCompleted).length;
    const pending = requirements.filter(r => !r.isCompleted).length;
    return [
      { name: 'Completed', value: completed, fill: '#10b981' },
      { name: 'Pending', value: pending, fill: '#f59e0b' }
    ];
  }, [requirements]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Requirements Management
            </CardTitle>
            {(userRole === 'employee' || userRole === 'admin') && (
              <RequirementCreateDialog
                loggedByName={loggedByName}
                onCreated={fetchRequirements}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading requirements...</div>
          ) : (
            <>
              {/* Professional Filter Bar */}
              <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Filter Requirements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Employees Filter */}
                  {userRole === 'admin' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Employees</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {selectedEmployees.length === 0
                                ? "All employees"
                                : `${selectedEmployees.length} selected`}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 space-y-2">
                          <div className="font-semibold text-sm mb-1">Select employees</div>
                          <div className="space-y-1 max-h-56 overflow-y-auto">
                            {availableEmployees.map((emp) => (
                              <label key={emp.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={selectedEmployees.includes(emp.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setSelectedEmployees((prev) => {
                                      if (checked) {
                                        return [...prev, emp.id]
                                      } else {
                                        return prev.filter((id) => id !== emp.id)
                                      }
                                    })
                                  }}
                                />
                                <span>{emp.name}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* States Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">States</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {selectedStates.length === 0
                              ? "All states"
                              : `${selectedStates.length} selected`}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 space-y-2">
                        <div className="font-semibold text-sm mb-1">Select states</div>
                        <div className="space-y-1 max-h-56 overflow-y-auto">
                          {availableStates.map((state) => (
                            <label key={state} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selectedStates.includes(state)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setSelectedStates((prev) => {
                                    if (checked) {
                                      return [...prev, state]
                                    } else {
                                      return prev.filter((s) => s !== state)
                                    }
                                  })
                                }}
                              />
                              <span>{state}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Status</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            {selectedStatuses.length === 0
                              ? "All statuses"
                              : `${selectedStatuses.length} selected`}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 space-y-2">
                        <div className="font-semibold text-sm mb-1">Select statuses</div>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedStatuses.includes('completed')}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setSelectedStatuses((prev) => {
                                  if (checked) {
                                    return [...prev, 'completed']
                                  } else {
                                    return prev.filter((s) => s !== 'completed')
                                  }
                                })
                              }}
                            />
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              Completed
                            </span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedStatuses.includes('pending')}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setSelectedStatuses((prev) => {
                                  if (checked) {
                                    return [...prev, 'pending']
                                  } else {
                                    return prev.filter((s) => s !== 'pending')
                                  }
                                })
                              }}
                            />
                            <span className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-orange-500" />
                              Pending
                            </span>
                          </label>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Date Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="Start Date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full"
                      />
                      <Input
                        type="date"
                        placeholder="End Date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Analytics Charts */}
              {requirements.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Requirements Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Requirements Over Time</CardTitle>
                      <CardDescription>Track requirement creation trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={requirementsOverTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={requirementsOverTimeData.length > 15 ? Math.floor(requirementsOverTimeData.length / 10) : 0}
                              minTickGap={10}
                            />
                            <YAxis 
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickLine={{ stroke: '#d1d5db' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                            />
                            <Bar dataKey="count" name="Requirements" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Requirements by Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Requirements by Status</CardTitle>
                      <CardDescription>View completion status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={requirementsByStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              dataKey="value"
                            >
                              {requirementsByStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Person Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Phone/Email</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
                        <div className="max-w-xs truncate" title={requirement.summary || requirement.description}>
                          {requirement.summary || requirement.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {requirement.state}
                        </div>
                      </TableCell>
                      <TableCell>{requirement.personName || 'N/A'}</TableCell>
                      <TableCell>
                        {requirement.requirementDate || requirement.date
                          ? new Date(requirement.requirementDate || requirement.date!).toLocaleDateString()
                          : new Date(requirement.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {requirement.phoneNumber && <div>{requirement.phoneNumber}</div>}
                          {requirement.email && <div className="text-gray-600">{requirement.email}</div>}
                          {!requirement.phoneNumber && !requirement.email && <span className="text-gray-400">N/A</span>}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Requirement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditRequirement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCustomerName">Company name</Label>
                <Input
                  id="editCustomerName"
                  value={editFormData.customerName}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editPersonName">Person name</Label>
                <Input
                  id="editPersonName"
                  value={editFormData.personName}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, personName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editState">State</Label>
                <Input
                  id="editState"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editCountry">Country</Label>
                <Input
                  id="editCountry"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editRequirementDate">Requirement date</Label>
                <Input
                  id="editRequirementDate"
                  type="date"
                  value={editFormData.requirementDate}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, requirementDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="editBudget">Budget</Label>
                <Input
                  id="editBudget"
                  type="number"
                  value={editFormData.budget}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, budget: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPhoneNumber">Phone</Label>
                <Input
                  id="editPhoneNumber"
                  type="tel"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            {editFormData.isLegacy ? (
              <div>
                <Label>Legacy description</Label>
                <Textarea
                  value={editFormData.legacyDescription}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, legacyDescription: e.target.value }))
                  }
                  rows={4}
                  required
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-700">
                    Diamond Specifications ({editFormData.specs.length})
                  </h3>
                </div>
                {editFormData.specs.map((spec, index) => (
                  <div key={index} className="relative">
                    {editFormData.specs.length > 1 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Specification #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-destructive hover:text-destructive"
                          onClick={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              specs: prev.specs.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                    <RequirementEntryForm
                      spec={spec}
                      onChange={(updated) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          specs: prev.specs.map((s, i) => (i === index ? updated : s)),
                        }))
                      }
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() =>
                    setEditFormData((prev) => ({
                      ...prev,
                      specs: [...prev.specs, defaultRequirementSpec()],
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Specification
                </Button>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full" disabled={updating}>
              {updating ? 'Updating…' : 'Update requirement'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 