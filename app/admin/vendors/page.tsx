"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PasswordGate } from '@/components/admin/PasswordGate';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { VendorFormDialog } from '@/components/vendors/VendorFormDialog';
import { DeleteConfirmDialog } from '@/components/vendors/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';

interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  location: string;
  totalBusiness: number;
  balanceDue: number;
}

interface VendorDetail {
  id: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  address: string;
  gstNumber?: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  location: string;
  businessType: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDetail | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const fetchVendors = useCallback(async () => {
    try {
      const url = debouncedQuery ? `/api/vendors?q=${encodeURIComponent(debouncedQuery)}` : '/api/vendors';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      } else {
        toast.error('Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Error fetching vendors');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Debounce the search query
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleEdit = async (vendor: Vendor) => {
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`);
      if (!res.ok) throw new Error('Failed to load vendor details');
      const fullVendor = await res.json();
      const detail: VendorDetail = {
        id: fullVendor.id,
        companyName: fullVendor.companyName,
        ownerName: fullVendor.ownerName,
        contactNumber: fullVendor.contactNumber,
        address: fullVendor.address,
        gstNumber: fullVendor.gstNumber ?? undefined,
        accountNumber: fullVendor.accountNumber,
        ifscCode: fullVendor.ifscCode,
        bankName: fullVendor.bankName,
        accountHolderName: fullVendor.accountHolderName,
        location: fullVendor.location,
        businessType: fullVendor.businessType,
      };
      setEditingVendor(detail);
      setIsFormOpen(true);
    } catch {
      toast.error('Failed to open edit form');
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Vendor deleted successfully');
        fetchVendors();
      } else {
        toast.error('Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Error deleting vendor');
    }
    setDeleteVendor(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
    fetchVendors();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <PasswordGate
        title="Vendor Management Access"
        description="Enter the password to access vendor management features"
        endpoint="/api/vendors/verify-password"
        sessionKey="vendors_unlocked"
      >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Vendors</h1>
            <p className="text-gray-600">Manage vendor relationships and diamond purchases</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by company, owner, contact, location"
                className="pl-9 border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
            <Button
            onClick={() => {
              setEditingVendor(null);
              setIsFormOpen(true);
            }}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
            </Button>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader className="bg-black">
              <TableRow className="bg-black">
                <TableHead className="text-white">Company Name</TableHead>
                <TableHead className="text-white">Owner</TableHead>
                <TableHead className="text-white">Contact</TableHead>
                <TableHead className="text-white">Location</TableHead>
                <TableHead className="text-white">Total Business</TableHead>
                <TableHead className="text-white">Balance Due</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      <span className="ml-2 text-gray-600">Loading vendors...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No vendors found. Add your first vendor to get started.
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium text-black">
                      {vendor.companyName}
                    </TableCell>
                    <TableCell className="text-gray-700">{vendor.ownerName}</TableCell>
                    <TableCell className="text-gray-700">{vendor.contactNumber}</TableCell>
                    <TableCell className="text-gray-700">{vendor.location}</TableCell>
                    <TableCell className="text-gray-700">
                      {formatCurrency(vendor.totalBusiness)}
                    </TableCell>
                    <TableCell className={`font-medium ${
                      vendor.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(vendor.balanceDue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/vendors/${vendor.id}`}>
                          <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-50">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                            <DropdownMenuItem
                              onClick={() => handleEdit(vendor)}
                              className="text-black hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteVendor(vendor)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Vendor Form Dialog */}
      <VendorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vendor={editingVendor}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteVendor}
        onOpenChange={(open) => !open && setDeleteVendor(null)}
        title="Delete Vendor"
        description={`Are you sure you want to delete ${deleteVendor?.companyName}? This action cannot be undone.`}
        onConfirm={() => deleteVendor && handleDelete(deleteVendor)}
      />
      </PasswordGate>
    </AdminLayout>
  );
}
