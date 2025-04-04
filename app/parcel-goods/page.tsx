"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
  const router = useRouter();
  const [prices, setPrices] = useState<Price[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    sieve: "",
    price: "",
  });

  useEffect(() => {
    const checkRole = async () => {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setIsAdmin(data?.role === 'admin');
    };
    checkRole();
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/parcel-goods");
      const data = await response.json();
      if (data.success) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("Failed to fetch prices");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const response = await fetch("/api/parcel-goods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Price added successfully");
        setFormData({ sieve: "", price: "" });
        fetchPrices();
      } else {
        toast.error(data.message || "Failed to add price");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to add price");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this price?")) {
      try {
        const response = await fetch(`/api/parcel-goods/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Price deleted successfully");
          fetchPrices();
        } else {
          toast.error("Failed to delete price");
        }
      } catch (error) {
        console.error("Error deleting price:", error);
        toast.error("Failed to delete price");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Parcel Goods Prices</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Price Form - Only visible to admin */}
          {isAdmin && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Add New Price</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sieve Size (mm)</label>
                  <select
                    value={formData.sieve}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sieve: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  >
                    <option value="">Select size</option>
                    {SIEVE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}mm
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Price
                </Button>
              </form>
            </Card>
          )}

          {/* Prices List */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Price List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sieve Size (mm)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prices.map((price) => (
                    <motion.tr
                      key={price.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.sieve}mm
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${price.price.toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/parcel-goods/edit/${price.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDelete(price.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}