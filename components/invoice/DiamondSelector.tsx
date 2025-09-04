"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string;
  stockId: string;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut: string | null;
  polish: string;
  sym: string;
  lab: string;
  pricePerCarat: number;
  finalAmount: number;
  status: 'AVAILABLE' | 'HOLD' | 'MEMO' | 'SOLD';
  certUrl?: string | null;
}

interface DiamondSelectorProps {
  onCreateInvoice: (selectedDiamonds: InventoryItem[]) => void;
  onCreateMemo: (selectedDiamonds: InventoryItem[]) => void;
}

export function DiamondSelector({ onCreateInvoice, onCreateMemo }: DiamondSelectorProps) {
  const [diamonds, setDiamonds] = useState<InventoryItem[]>([]);
  const [selectedDiamonds, setSelectedDiamonds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<'invoice' | 'memo' | null>(null);

  useEffect(() => {
    fetchDiamonds();
  }, []);

  const fetchDiamonds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory-items?status=AVAILABLE&take=100');
      const data = await response.json();
      
      if (data.items) {
        // Only show available diamonds for selection
        const availableDiamonds = data.items.filter((item: InventoryItem) => item.status === 'AVAILABLE');
        setDiamonds(availableDiamonds);
      }
    } catch (error) {
      console.error('Failed to fetch diamonds:', error);
      toast.error('Failed to load diamonds');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDiamond = (id: string) => {
    const newSelected = new Set(selectedDiamonds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDiamonds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDiamonds(new Set(diamonds.map(d => d.id)));
    } else {
      setSelectedDiamonds(new Set());
    }
  };

  const getSelectedDiamonds = () => {
    return diamonds.filter(d => selectedDiamonds.has(d.id));
  };

  const handleCreateInvoice = async () => {
    const selected = getSelectedDiamonds();
    if (selected.length === 0) {
      toast.error('Please select at least one diamond');
      return;
    }
    
    setCreating('invoice');
    try {
      await onCreateInvoice(selected);
    } finally {
      setCreating(null);
    }
  };

  const handleCreateMemo = async () => {
    const selected = getSelectedDiamonds();
    if (selected.length === 0) {
      toast.error('Please select at least one diamond');
      return;
    }
    
    setCreating('memo');
    try {
      await onCreateMemo(selected);
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Diamonds from Inventory</span>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateInvoice}
              disabled={selectedDiamonds.size === 0 || creating !== null}
              className="flex items-center gap-2"
            >
              {creating === 'invoice' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Create Invoice ({selectedDiamonds.size})
            </Button>
            <Button
              onClick={handleCreateMemo}
              disabled={selectedDiamonds.size === 0 || creating !== null}
              variant="outline"
              className="flex items-center gap-2"
            >
              {creating === 'memo' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4" />
              )}
              Create Memo ({selectedDiamonds.size})
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-black">
              <TableRow className="bg-black">
                <TableHead className="w-12 text-white">
                  <Checkbox
                    checked={selectedDiamonds.size === diamonds.length && diamonds.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="text-white">Stock ID</TableHead>
                <TableHead className="text-white">Shape</TableHead>
                <TableHead className="text-white">Carat</TableHead>
                <TableHead className="text-white">Color</TableHead>
                <TableHead className="text-white">Clarity</TableHead>
                <TableHead className="text-white">Cut</TableHead>
                <TableHead className="text-white">Polish</TableHead>
                <TableHead className="text-white">Sym</TableHead>
                <TableHead className="text-white">Lab</TableHead>
                <TableHead className="text-white">Price/Ct</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diamonds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                    No available diamonds found
                  </TableCell>
                </TableRow>
              ) : (
                diamonds.map((diamond) => (
                  <TableRow
                    key={diamond.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectDiamond(diamond.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDiamonds.has(diamond.id)}
                        onChange={() => handleSelectDiamond(diamond.id)}
                      />
                    </TableCell>
                    <TableCell>{diamond.stockId}</TableCell>
                    <TableCell>{diamond.shape}</TableCell>
                    <TableCell>{diamond.size.toFixed(2)}</TableCell>
                    <TableCell>{diamond.color}</TableCell>
                    <TableCell>{diamond.clarity}</TableCell>
                    <TableCell>{diamond.cut || '-'}</TableCell>
                    <TableCell>{diamond.polish}</TableCell>
                    <TableCell>{diamond.sym}</TableCell>
                    <TableCell>{diamond.lab}</TableCell>
                    <TableCell>{formatCurrency(diamond.pricePerCarat)}</TableCell>
                    <TableCell>{formatCurrency(diamond.finalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(diamond.status)}>
                        {diamond.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {selectedDiamonds.size > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                Selected: {selectedDiamonds.size} diamond(s)
              </span>
              <span className="font-medium">
                Total Value: {formatCurrency(
                  getSelectedDiamonds().reduce((sum, d) => sum + d.finalAmount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

