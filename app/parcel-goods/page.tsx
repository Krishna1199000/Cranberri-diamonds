"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { Edit2, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { CranberriLoader } from "@/components/ui/CranberriLoader";


const SIEVE_SIZES = [
  "0.8", "0.9", "1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8",
  "1.9", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5"
];

interface Price {
  id: string;
  sieve: string;
  price: number;
}

export default function ParcelGoods() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [, setCurrentUserId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formData, setFormData] = useState({
    sieve: "",
    price: "",
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const checkRoleAndFetch = async () => {
      try {
        const roleResponse = await fetch('/api/auth/me', { credentials: 'include' });
         if (!roleResponse.ok) {
          toast.error("Session expired or invalid. Please sign in.");
          router.push('/auth/signin');
          return;
        }
        const roleData = await roleResponse.json();
        setUserRole(roleData.role);
        setCurrentUserId(roleData.id);

        if (roleData.role === 'admin' || roleData.role === 'employee' || roleData.role === 'customer') {
           await fetchPrices();
        } else {
           toast.error("Access Denied. Please sign in with appropriate credentials.");
           router.push('/auth/signin');
        }

      } catch (error) {
          console.error("Error during initial setup:", error);
          toast.error("Failed to load initial data.");
          router.push('/auth/signin');
      } finally {
          setLoading(false);
      }
    };
    checkRoleAndFetch();
  }, [router]);

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/parcel-goods");
      const data = await response.json();
      if (data.success) {
        const sortedPrices = data.prices.sort((a: Price, b: Price) => parseFloat(a.sieve) - parseFloat(b.sieve));
        setPrices(sortedPrices);
      } else {
          throw new Error(data.message || "Failed to fetch prices");
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch prices");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userRole !== 'admin') {
        toast.error("Unauthorized action.");
        return;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `/api/parcel-goods/${editingId}` 
        : "/api/parcel-goods";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Price ${isEditing ? "updated" : "added"} successfully`);
        setFormData({ sieve: "", price: "" });
        setIsEditing(false);
        setEditingId("");
        fetchPrices();
      } else {
        toast.error(data.message || `Failed to ${isEditing ? "update" : "add"} price`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Failed to ${isEditing ? "update" : "add"} price`);
    }
  };

  const handleEdit = (price: Price) => {
    if (userRole !== 'admin') return;
    setIsEditing(true);
    setEditingId(price.id);
    setFormData({
      sieve: price.sieve,
      price: price.price.toString(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') {
        toast.error("Unauthorized action.");
        return;
    }
    if (confirm("Are you sure you want to delete this price?")) {
      try {
        const response = await fetch(`/api/parcel-goods/${id}`, {
          method: "DELETE",
           credentials: 'include'
        });

        if (response.ok) {
          toast.success("Price deleted successfully");
          fetchPrices();
        } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.message || "Failed to delete price");
        }
      } catch (error) {
        console.error("Error deleting price:", error);
        toast.error("Failed to delete price");
      }
    }
  };

  if (loading) {
      return <CranberriLoader />;
  }

  const LayoutComponent =
       userRole === 'admin' ? AdminLayout
     : userRole === 'employee' ? EmployeeLayout
     : userRole === 'customer' ? CustomerLayout
     : null;

  if (!LayoutComponent) {
       return <div className="flex justify-center items-center min-h-screen">Error: Invalid user role or session.</div>;
  }

  const canEdit = userRole === 'admin';

  return (
    <LayoutComponent>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Parcel Goods Management</h1>

        <div className="w-full">
            <div className={`grid grid-cols-1 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
          {canEdit && (
            <Card className="lg:col-span-1">
              <CardHeader>
                 <CardTitle>{isEditing ? "Edit Price" : "Add New Price"}</CardTitle>
              </CardHeader>
              <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Sieve Size (mm)</label>
                       <Select 
                         value={formData.sieve}
                         onValueChange={(value) => setFormData((prev) => ({ ...prev, sieve: value }))}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select size" />
                         </SelectTrigger>
                         <SelectContent>
                           {SIEVE_SIZES.map((size) => (
                             <SelectItem key={size} value={size}>
                               {size}mm
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Price ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      {isEditing ? "Update Price" : "Add Price"}
                    </Button>
                     {isEditing && (
                        <Button type="button" variant="outline" className="w-full" onClick={() => {setIsEditing(false); setEditingId(""); setFormData({ sieve: "", price: "" });}}>
                            Cancel Edit
                        </Button>
                    )}
                  </form>
              </CardContent>
            </Card>
          )}

          <Card className={canEdit ? "lg:col-span-2" : "lg:col-span-3"}>
             <CardHeader>
                 <CardTitle>Price List</CardTitle>
             </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Sieve Size (mm)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        {canEdit && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {prices.map((price) => (
                        <motion.tr
                          key={price.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {price.sieve}mm
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            ${price.price.toFixed(2)}
                          </td>
                          {canEdit && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleEdit(price)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-8 w-8"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-8 w-8"
                                  onClick={() => handleDelete(price.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      ))}
                       {prices.length === 0 && (
                           <tr>
                               <td colSpan={canEdit ? 3 : 2} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                   No prices have been added yet.
                               </td>
                           </tr>
                       )}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
            </div>
        </div>
    </LayoutComponent>
  );
}