"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash, CreditCard as CreditCardIcon, Eye, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';

interface CardHolder {
  id: string;
  name: string;
  last4: string;
  transactions: CardTransaction[];
}

interface CardTransaction {
  id: string;
  cardId: string;
  date: string;
  balance: number;
  usedBalance: number;
  dueDate: string;
  emiDate: string;
  charges: number;
  note?: string | null;
}

export function CreditCardsPanel() {
  const [holders, setHolders] = useState<CardHolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolderFormOpen, setIsHolderFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingHolder, setEditingHolder] = useState<CardHolder | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<CardTransaction | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewingHolder, setViewingHolder] = useState<CardHolder | null>(null);
  const [isTransactionSubmitting, setIsTransactionSubmitting] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isHolderSubmitting, setIsHolderSubmitting] = useState(false);
  const [deletingHolderId, setDeletingHolderId] = useState<string | null>(null);

  const holderFormSchema = z.object({ 
    name: z.string().optional(), 
    cardNumber: z.string().optional() 
  });
  
  const transactionFormSchema = z.object({
    date: z.string().optional(),
    balance: z.string().optional(),
    usedBalance: z.string().optional(),
    dueDate: z.string().optional(),
    emiDate: z.string().optional(),
    charges: z.string().optional(),
    note: z.string().optional()
  });

  const holderForm = useForm<z.infer<typeof holderFormSchema>>({ 
    resolver: zodResolver(holderFormSchema), 
    defaultValues: { name: '', cardNumber: '' } 
  });

  const transactionForm = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      balance: '0',
      usedBalance: '0',
      dueDate: new Date().toISOString().split('T')[0],
      emiDate: new Date().toISOString().split('T')[0],
      charges: '0',
      note: ''
    }
  });

  const fetchHolders = async () => {
    try {
      const res = await fetch('/api/finance/cards');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setHolders(data);
    } catch {
      toast.error('Failed to load card holders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolders();
  }, []);

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-IN');
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isDueDatePassed = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  const handleAddTransaction = (cardId: string) => {
    setSelectedCardId(cardId);
    setEditingTransaction(null);
    transactionForm.reset({
      date: new Date().toISOString().split('T')[0],
      balance: '0',
      usedBalance: '0',
      dueDate: new Date().toISOString().split('T')[0],
      emiDate: new Date().toISOString().split('T')[0],
      charges: '0',
      note: ''
    });
    setIsTransactionFormOpen(true);
  };

  const handleEditTransaction = (transaction: CardTransaction) => {
    setEditingTransaction(transaction);
    setSelectedCardId(transaction.cardId);
    transactionForm.reset({
      date: transaction.date.split('T')[0],
      balance: transaction.balance.toString(),
      usedBalance: transaction.usedBalance.toString(),
      dueDate: transaction.dueDate.split('T')[0],
      emiDate: transaction.emiDate.split('T')[0],
      charges: transaction.charges.toString(),
      note: transaction.note || ''
    });
    setIsTransactionFormOpen(true);
  };

  const handleViewDetails = (holder: CardHolder) => {
    setViewingHolder(holder);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black">Credit Cards</h2>
          <p className="text-gray-600">Manage card holders and transactions</p>
        </div>
        <Button
          onClick={() => {
            setEditingHolder(null);
            setIsHolderFormOpen(true);
          }}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card Holder
        </Button>
      </div>

      <Card className="bg-white border">
        <CardHeader>
          <CardTitle className="text-black">Credit Cards Overview</CardTitle>
          <CardDescription>List of all credit cards with key information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black">
                <TableRow className="bg-black">
                  <TableHead className="text-white">Card Holder</TableHead>
                  <TableHead className="text-white">Card Number</TableHead>
                  <TableHead className="text-white">Due Date</TableHead>
                  <TableHead className="text-white">Available Balance</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                        <span className="ml-2 text-gray-600">Loading credit cards...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : holders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No credit cards yet. Add your first card holder to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  holders.map((holder) => {
                    const latestTransaction = holder.transactions && holder.transactions.length > 0 
                      ? holder.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                      : null;
                    
                    return (
                      <TableRow key={holder.id}>
                        <TableCell className="font-medium text-black">{holder.name}</TableCell>
                      <TableCell className="text-gray-700 flex items-center gap-2">
                          <CreditCardIcon className="h-4 w-4" /> **** **** **** {holder.last4}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {latestTransaction ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(latestTransaction.dueDate)}
                            </div>
                          ) : (
                            <span className="text-gray-400">No transactions</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {latestTransaction ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(latestTransaction.balance)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-black hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(holder)}
                                className="text-black hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAddTransaction(holder.id)}
                                className="text-black hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Transaction
                              </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                  setEditingHolder(holder);
                                setIsHolderFormOpen(true);
                              }}
                              className="text-black hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                    try {
                                      setDeletingHolderId(holder.id);
                                      const res = await fetch(`/api/finance/cards/${holder.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  toast.success('Card holder deleted');
                                  fetchHolders();
                                } else {
                                  toast.error('Failed to delete');
                                      }
                                    } catch {
                                      toast.error('Failed to delete');
                                    } finally {
                                      setDeletingHolderId(null);
                                }
                              }}
                                  disabled={deletingHolderId === holder.id}
                              className="text-red-600 hover:bg-red-50"
                            >
                                  {deletingHolderId === holder.id ? (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                      Deleting...
                                    </div>
                                  ) : (
                                    <>
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                                    </>
                                  )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Card Holder Dialog */}
      <Dialog open={isHolderFormOpen} onOpenChange={(o) => { 
        setIsHolderFormOpen(o); 
        if (!o) { 
          setEditingHolder(null); 
          holderForm.reset({ name: '', cardNumber: '' }); 
        } 
      }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">{editingHolder ? 'Edit Card Holder' : 'Add Card Holder'}</DialogTitle>
            <DialogDescription className="text-gray-600">{editingHolder ? 'Update holder details' : 'Enter holder name and full card number'}</DialogDescription>
          </DialogHeader>
          <Form {...holderForm}>
            <form
              onSubmit={holderForm.handleSubmit(async (data) => {
                try {
                  setIsHolderSubmitting(true);
                  const url = editingHolder ? `/api/finance/cards/${editingHolder.id}` : '/api/finance/cards';
                  const method = editingHolder ? 'PUT' : 'POST';
                  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                  if (!res.ok) throw new Error('Failed');
                  toast.success(`Card holder ${editingHolder ? 'updated' : 'created'}`);
                  setIsHolderFormOpen(false);
                  setEditingHolder(null);
                  holderForm.reset({ name: '', cardNumber: '' });
                  fetchHolders();
                } catch {
                  toast.error('Save failed');
                } finally {
                  setIsHolderSubmitting(false);
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={holderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-gray-300 focus:border-black focus:ring-black" placeholder="Card holder name" disabled={isHolderSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={holderForm.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Card Number</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-gray-300 focus:border-black focus:ring-black" placeholder="Enter full card number" disabled={isHolderSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsHolderFormOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50" disabled={isHolderSubmitting}>Cancel</Button>
                <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isHolderSubmitting}>
                  {isHolderSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingHolder ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingHolder ? 'Update' : 'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isTransactionFormOpen} onOpenChange={(o) => { 
        setIsTransactionFormOpen(o); 
        if (!o) { 
          setEditingTransaction(null); 
          setSelectedCardId(null);
        } 
      }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription className="text-gray-600">{editingTransaction ? 'Update transaction details' : 'Enter transaction information'}</DialogDescription>
          </DialogHeader>
          <Form {...transactionForm}>
            <form
              onSubmit={transactionForm.handleSubmit(async (data) => {
                try {
                  setIsTransactionSubmitting(true);
                  const url = editingTransaction ? `/api/finance/transactions/${editingTransaction.id}` : '/api/finance/transactions';
                  const method = editingTransaction ? 'PUT' : 'POST';
                  
                  // Prepare the data for API call
                  const apiData = {
                    date: data.date,
                    balance: parseFloat(data.balance),
                    usedBalance: parseFloat(data.usedBalance),
                    dueDate: data.dueDate,
                    emiDate: data.emiDate,
                    charges: parseFloat(data.charges),
                    note: data.note,
                    cardId: selectedCardId
                  };
                  
                  const res = await fetch(url, { 
                    method, 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(apiData) 
                  });
                  if (!res.ok) throw new Error('Failed');
                  toast.success(`Transaction ${editingTransaction ? 'updated' : 'created'}`);
                  setIsTransactionFormOpen(false);
                  setEditingTransaction(null);
                  setSelectedCardId(null);
                  fetchHolders();
                } catch {
                  toast.error('Save failed');
                } finally {
                  setIsTransactionSubmitting(false);
                }
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                              <FormField
                control={transactionForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Transaction Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="border-gray-300 focus:border-black focus:ring-black" disabled={isTransactionSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={transactionForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Due Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="border-gray-300 focus:border-black focus:ring-black" disabled={isTransactionSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Available Balance</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="usedBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Used Balance</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="emiDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">EMI Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="border-gray-300 focus:border-black focus:ring-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="charges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Charges</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="border-gray-300 focus:border-black focus:ring-black" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={transactionForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Note</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-gray-300 focus:border-black focus:ring-black" placeholder="Optional note" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTransactionFormOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50" disabled={isTransactionSubmitting}>Cancel</Button>
                <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isTransactionSubmitting}>
                  {isTransactionSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingTransaction ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingTransaction ? 'Update' : 'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingHolder} onOpenChange={(o) => !o && setViewingHolder(null)}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Credit Card Details - {viewingHolder?.name}</DialogTitle>
            <DialogDescription className="text-gray-600">Complete transaction history and card information</DialogDescription>
          </DialogHeader>
          
          {viewingHolder && (
            <div className="space-y-6">
              {/* Card Information */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg text-black">Card Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Card Holder</Label>
                      <p className="text-black font-medium">{viewingHolder.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Card Number</Label>
                      <p className="text-black font-medium flex items-center gap-2">
                        <CreditCardIcon className="h-4 w-4" />
                        **** **** **** {viewingHolder.last4}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-black">Transaction History</CardTitle>
                  <Button
                    onClick={() => handleAddTransaction(viewingHolder.id)}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </CardHeader>
                <CardContent>
                  {viewingHolder.transactions && viewingHolder.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-black font-semibold">Date</TableHead>
                            <TableHead className="text-black font-semibold">Due Date</TableHead>
                            <TableHead className="text-black font-semibold">Available Balance</TableHead>
                            <TableHead className="text-black font-semibold">Used Balance</TableHead>
                            <TableHead className="text-black font-semibold">EMI Date</TableHead>
                            <TableHead className="text-black font-semibold">Charges</TableHead>
                            <TableHead className="text-black font-semibold">Note</TableHead>
                            <TableHead className="text-black font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingHolder.transactions
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((transaction) => {
                              const isOverdue = isDueDatePassed(transaction.dueDate);
                              return (
                            <TableRow key={transaction.id} className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}>
                              <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{formatDate(transaction.date)}</TableCell>
                              <TableCell className={`font-bold ${isOverdue ? "text-red-600" : "text-gray-700"}`}>{formatDate(transaction.dueDate)}</TableCell>
                              <TableCell className={`font-medium ${isOverdue ? "text-red-700" : "text-gray-700"}`}>{formatCurrency(transaction.balance)}</TableCell>
                              <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{formatCurrency(transaction.usedBalance)}</TableCell>
                              <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{formatDate(transaction.emiDate)}</TableCell>
                              <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{formatCurrency(transaction.charges)}</TableCell>
                              <TableCell className={isOverdue ? "text-red-700" : "text-gray-700"}>{transaction.note || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditTransaction(transaction)}
                                    className="text-black hover:bg-gray-50"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                                                     <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={async () => {
                                       try {
                                         setDeletingTransactionId(transaction.id);
                                         const res = await fetch(`/api/finance/transactions/${transaction.id}`, { method: 'DELETE' });
                                         if (res.ok) {
                                           toast.success('Transaction deleted');
                                           fetchHolders();
                                         } else {
                                           toast.error('Failed to delete');
                                         }
                                       } catch {
                                         toast.error('Failed to delete');
                                       } finally {
                                         setDeletingTransactionId(null);
                                       }
                                     }}
                                     disabled={deletingTransactionId === transaction.id}
                                     className="text-red-600 hover:bg-red-50"
                                   >
                                     {deletingTransactionId === transaction.id ? (
                                       <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                     ) : (
                                       <Trash className="h-3 w-3" />
                                     )}
                                   </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found. Add your first transaction to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


