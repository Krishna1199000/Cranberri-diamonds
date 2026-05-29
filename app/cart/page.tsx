"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { CranberriLoader } from "@/components/ui/CranberriLoader";
import { toast } from "sonner";
import {
  CartStone,
  CART_UPDATED_EVENT,
  getCart,
  removeFromCart,
  updateCartItemPrice,
} from "@/lib/utils/cart";

type Role = "admin" | "employee" | "customer" | "";

interface CompanyOption {
  id: string;
  companyName: string;
}

interface CartContentProps {
  userId: string;
  role: Role;
}

function CartContent({ userId, role }: CartContentProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartStone[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [invoiceTermDays, setInvoiceTermDays] = useState<number>(7);
  const [memoTermDays, setMemoTermDays] = useState<number>(7);

  useEffect(() => {
    setItems(getCart(userId));

    const refresh = () => setItems(getCart(userId));
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CART_UPDATED_EVENT, refresh);
  }, [userId]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companyRes = await fetch("/api/companies", { credentials: "include" });
        if (companyRes.ok) {
          const data = await companyRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load companies:", error);
      }
    };
    loadCompanies();
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.size * (Number(item.pricePerCarat) || 0), 0),
    [items]
  );

  const employeeBlocked = useMemo(
    () => role === "employee" && items.some((item) => Number(item.enteredPricePerCarat) < item.redPricePerCarat),
    [items, role]
  );

  const handleEnteredPriceChange = (id: string, value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return;
    setItems(updateCartItemPrice(userId, id, numeric));
  };

  const handleRemove = (id: string) => {
    setItems(removeFromCart(userId, id));
  };

  const ensureReadyForDocument = () => {
    if (!selectedCompanyId) {
      toast.error("Please select Company / Party Name.");
      return false;
    }
    if (items.length === 0) {
      toast.error("Cart is empty.");
      return false;
    }
    if (employeeBlocked) {
      toast.error("Price is below the minimum allowed rate. Please contact your admin.");
      return false;
    }
    return true;
  };

  const buildPrefilledItems = () =>
    items.map((item) => ({
      description: `${item.shape} ${item.size}ct ${item.color} ${item.clarity}`,
      carat: item.size,
      color: item.color,
      clarity: item.clarity,
      shape: item.shape,
      lab: item.lab || "",
      reportNo: item.certificateNo || item.stockId,
      stockId: item.stockId,
      pricePerCarat: Number(item.pricePerCarat),
      enteredPricePerCarat: Number(item.enteredPricePerCarat),
    }));

  const handleGenerateInvoice = () => {
    if (!ensureReadyForDocument() || !selectedCompany) return;

    const now = new Date();
    sessionStorage.setItem(
      "prefilledInvoiceData",
      JSON.stringify({
        date: now,
        dueDate: new Date(now.getTime() + invoiceTermDays * 24 * 60 * 60 * 1000),
        paymentTerms: invoiceTermDays,
        shipmentId: selectedCompanyId,
        description: `Invoice for ${selectedCompany.companyName}`,
        shipmentCost: 0,
        discount: 0,
        crPayment: 0,
        emailEnabled: true,
        items: buildPrefilledItems(),
      })
    );
    router.push("/invoices/new?fromCart=true");
  };

  const handleGenerateMemo = () => {
    if (!ensureReadyForDocument() || !selectedCompany) return;

    const now = new Date();
    sessionStorage.setItem(
      "prefilledMemoData",
      JSON.stringify({
        date: now,
        dueDate: new Date(now.getTime() + memoTermDays * 24 * 60 * 60 * 1000),
        paymentTerms: memoTermDays,
        memoTerms: memoTermDays,
        shipmentId: selectedCompanyId,
        description: `Memo for ${selectedCompany.companyName}`,
        shipmentCost: 0,
        discount: 0,
        crPayment: 0,
        items: buildPrefilledItems(),
      })
    );
    router.push("/memos/new?fromCart=true");
  };

  if (role === "customer") {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-red-600">Cart is available only for Admin and Employee roles.</p>
        </CardContent>
      </Card>
    );
  }

  const inventoryHref = role === "admin" ? "/admin/inventory" : "/employee/inventory";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cart ({items.length})</CardTitle>
        <CardDescription>
          Add stones from Inventory, select a party, then generate an Invoice or Memo. Document creation happens on the invoice/memo page with your cart data pre-filled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="partySelect">Select Company / Party Name</Label>
            <select
              id="partySelect"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceTermDays">Invoice Payment Term (days)</Label>
            <Input
              id="invoiceTermDays"
              type="number"
              min={1}
              value={invoiceTermDays}
              onChange={(e) => setInvoiceTermDays(Number(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">Used when generating an invoice</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="memoTermDays">Memo Term (days)</Label>
            <Input
              id="memoTermDays"
              type="number"
              min={1}
              value={memoTermDays}
              onChange={(e) => setMemoTermDays(Number(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">Used when generating a memo</p>
          </div>
        </div>

        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report No / Certificate</TableHead>
                <TableHead>Shape</TableHead>
                <TableHead>Carat</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead>Clarity</TableHead>
                <TableHead>Cut</TableHead>
                <TableHead>Polish</TableHead>
                <TableHead>Symmetry</TableHead>
                <TableHead>Fluorescence</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Asking Price</TableHead>
                <TableHead>Entered Price</TableHead>
                <TableHead>Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                    <p>No stones in cart.</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href={inventoryHref}>Go to Inventory to add stones</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const belowRed = Number(item.enteredPricePerCarat) < item.redPricePerCarat;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.certificateNo || item.stockId}</TableCell>
                      <TableCell>{item.shape}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.clarity}</TableCell>
                      <TableCell>{item.cut || "-"}</TableCell>
                      <TableCell>{item.polish || "-"}</TableCell>
                      <TableCell>{item.sym || "-"}</TableCell>
                      <TableCell>{item.flourence || "-"}</TableCell>
                      <TableCell>{item.lab || "-"}</TableCell>
                      <TableCell>{item.pricePerCarat}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={item.enteredPricePerCarat}
                          onChange={(e) => handleEnteredPriceChange(item.id, e.target.value)}
                        />
                        {role === "employee" && belowRed && (
                          <p className="text-xs text-red-600 mt-1">
                            Price is below the minimum allowed rate. Please contact your admin.
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleRemove(item.id)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="text-sm font-medium">Subtotal (Asking): {subtotal.toFixed(2)}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateMemo} disabled={items.length === 0}>
              Generate Memo
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={items.length === 0}>
              Generate Invoice
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      try {
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!userRes.ok) {
          toast.error("Please sign in to access cart.");
          router.push("/auth/signin");
          return;
        }
        const user = await userRes.json();
        if (user.role !== "admin" && user.role !== "employee") {
          setRole(user.role || "customer");
          setLoading(false);
          return;
        }
        setUserId(user.id);
        setRole(user.role);
      } catch (error) {
        console.error("Cart initialization failed:", error);
        toast.error("Failed to load cart.");
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [router]);

  if (loading) {
    return <CranberriLoader />;
  }

  if (role === "admin") {
    return (
      <AdminLayout>
        <CartContent userId={userId} role={role} />
      </AdminLayout>
    );
  }

  if (role === "employee") {
    return (
      <EmployeeLayout>
        <CartContent userId={userId} role={role} />
      </EmployeeLayout>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <CartContent userId={userId} role={role} />
    </div>
  );
}
