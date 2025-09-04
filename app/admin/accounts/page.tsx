"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PasswordGate } from '@/components/finance/PasswordGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, MoreHorizontal, Edit, Trash, Filter, RotateCcw, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { LedgerEntryFormDialog } from '@/components/finance/LedgerEntryFormDialog';
import { DeleteConfirmDialog } from '@/components/vendors/DeleteConfirmDialog';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  amountINR: number;
  reason: string;
  counterparty: string | null;
}

interface AccountStats {
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
}

export default function AccountsPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState<AccountStats>({
    totalCredit: 0,
    totalDebit: 0,
    netAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LedgerEntry | null>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/finance/ledger?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch ledger entries');
      }
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      toast.error('Error fetching ledger entries');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, filterType]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleFilter = () => {
    setIsLoading(true);
    fetchEntries();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setFilterType('all');
    setIsLoading(true);
    fetchEntries();
  };

  const handleEdit = (entry: LedgerEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = async (entry: LedgerEntry) => {
    try {
      const response = await fetch(`/api/finance/ledger/${entry.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Entry deleted successfully');
        fetchEntries();
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Error deleting entry');
    }
    setDeleteEntry(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    fetchEntries();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <AdminLayout>
      <PasswordGate
        title="Accounts Access Required"
        description="Enter the security password to access account statements."
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Account Statements</h1>
              <p className="text-gray-600">Manage ledger entries and account balances</p>
            </div>
            <Button
              onClick={() => {
                setEditingEntry(null);
                setIsFormOpen(true);
              }}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-white border">
            <CardHeader>
              <CardTitle className="text-black">Filters</CardTitle>
              <CardDescription>Filter entries by date range and type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-black">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-black">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-black">Entry Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="CREDIT">Credit</SelectItem>
                      <SelectItem value="DEBIT">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end space-x-2">
                  <Button
                    onClick={handleFilter}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Credit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCredit)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Debit</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDebit)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Balance</CardTitle>
                <Calculator className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netAmount)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{entries.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card className="bg-white border">
            <CardHeader>
              <CardTitle className="text-black">Ledger Entries</CardTitle>
              <CardDescription>Complete record of all account transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black">
                    <TableRow className="bg-black">
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Reason</TableHead>
                      <TableHead className="text-white">Counterparty</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                            <span className="ml-2 text-gray-600">Loading entries...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No ledger entries found. Add your first entry to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-black font-medium">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              entry.type === 'CREDIT' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {entry.type}
                            </span>
                          </TableCell>
                          <TableCell className={`font-medium ${
                            entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.type === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amountINR)}
                          </TableCell>
                          <TableCell className="text-gray-700">{entry.reason}</TableCell>
                          <TableCell className="text-gray-700">{entry.counterparty || '-'}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(entry)}
                                  className="text-black hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteEntry(entry)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entry Form Dialog */}
        <LedgerEntryFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          entry={editingEntry}
          onSuccess={handleFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={!!deleteEntry}
          onOpenChange={(open) => !open && setDeleteEntry(null)}
          title="Delete Ledger Entry"
          description={`Are you sure you want to delete this ${deleteEntry?.type.toLowerCase()} entry? This action cannot be undone.`}
          onConfirm={() => deleteEntry && handleDelete(deleteEntry)}
        />
      </PasswordGate>
    </AdminLayout>
  );
}

