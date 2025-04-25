"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X, PlusCircle } from "lucide-react"
import { toast } from "sonner"

interface SaleItem {
  id?: string
  carat: string
  color: string
  clarity: string
  certificateNo: string
  pricePerCarat: string
  totalValue: string
}

export interface SalesFormData {
  companyName: string
  trackingId: string
  shipmentCarrier: string
  totalSaleValue: string
  description: string
  saleDate: string
  isNoSale: boolean
  saleItems: SaleItem[]
}

interface SalesEntryFormProps {
  refreshData: () => void
}

export function SalesEntryForm({ refreshData }: SalesEntryFormProps) {
  const [companies, setCompanies] = useState<{ id: string; companyName: string }[]>([])
  const [isNoSale, setIsNoSale] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const emptySaleItem: SaleItem = {
    carat: "",
    color: "",
    clarity: "",
    certificateNo: "",
    pricePerCarat: "",
    totalValue: "0.00"
  }

  const [formData, setFormData] = useState<SalesFormData>({
    companyName: "",
    trackingId: "",
    shipmentCarrier: "",
    totalSaleValue: "0.00",
    description: "",
    saleDate: new Date().toISOString().split("T")[0],
    isNoSale: false,
    saleItems: [{ ...emptySaleItem }]
  })

  const shipmentCarriers = [
    { value: "UPS", label: "UPS" },
    { value: "FedEx", label: "FedEx" },
    { value: "USPS", label: "USPS" },
    { value: "DHL", label: "DHL" },
  ]

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast.error("Failed to fetch companies")
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (!isNoSale) {
      const total = formData.saleItems.reduce((acc, item) => {
        return acc + (parseFloat(item.totalValue || "0") || 0);
      }, 0);
      
      setFormData(prev => ({
        ...prev,
        totalSaleValue: total.toFixed(2)
      }));
    }
  }, [formData.saleItems, isNoSale]);

  const updateSaleItemTotal = (index: number, field: keyof SaleItem, value: string) => {
    const newSaleItems = [...formData.saleItems];
    newSaleItems[index] = {
      ...newSaleItems[index],
      [field]: value
    };

    if (field === 'carat' || field === 'pricePerCarat') {
      const carat = parseFloat(newSaleItems[index].carat || "0");
      const pricePerCarat = parseFloat(newSaleItems[index].pricePerCarat || "0");
      
      if (carat && pricePerCarat) {
        const totalValue = (carat * pricePerCarat).toFixed(2);
        newSaleItems[index].totalValue = totalValue;
      }
    }

    setFormData(prev => ({
      ...prev,
      saleItems: newSaleItems
    }));
  };

  const addSaleItem = () => {
    setFormData(prev => ({
      ...prev,
      saleItems: [...prev.saleItems, { ...emptySaleItem }]
    }));
  };

  const removeSaleItem = (index: number) => {
    if (formData.saleItems.length === 1) {
      toast.error("At least one sale item is required");
      return;
    }
    
    const newSaleItems = formData.saleItems.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      saleItems: newSaleItems
    }));
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      trackingId: "",
      shipmentCarrier: "",
      totalSaleValue: "0.00",
      description: "",
      saleDate: new Date().toISOString().split("T")[0],
      isNoSale: false,
      saleItems: [{ ...emptySaleItem }]
    });
    setIsNoSale(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!isNoSale && formData.saleItems.length === 0) {
        toast.error("At least one sale item is required");
        setIsSubmitting(false);
        return;
      }

      if (!isNoSale) {
        const invalidItems = formData.saleItems.filter(
          item => !item.carat || !item.pricePerCarat || !item.certificateNo
        );
        
        if (invalidItems.length > 0) {
          toast.error("All sale items must have carat, price per carat, and certificate number");
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Sales entry submitted successfully");
        resetForm();
        refreshData();
      } else {
        toast.error(data.message || "Failed to submit sales entry");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit sales entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">New Sales Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4 flex gap-4">
          <Button
            type="button"
            onClick={() => {
              setIsNoSale(false)
              setFormData((prev) => ({ ...prev, isNoSale: false }))
            }}
            className={`flex-1 ${!isNoSale ? "bg-blue-600" : "bg-gray-300"}`}
          >
            Regular Sale
          </Button>
          <Button
            type="button"
            onClick={() => {
              setIsNoSale(true)
              setFormData((prev) => ({
                ...prev,
                isNoSale: true,
                companyName: "",
                trackingId: "",
                shipmentCarrier: "",
                totalSaleValue: "0.00",
                saleItems: [{ ...emptySaleItem }]
              }))
            }}
            className={`flex-1 ${isNoSale ? "bg-blue-600" : "bg-gray-300"}`}
          >
            No Sale
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sale Date</label>
          <Input
            type="date"
            value={formData.saleDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, saleDate: e.target.value }))}
            className="w-full"
          />
        </div>

        {!isNoSale && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <Select
                value={formData.companyName}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, companyName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.companyName}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Shipment</label>
              <Select
                value={formData.shipmentCarrier}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, shipmentCarrier: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Carrier" />
                </SelectTrigger>
                <SelectContent>
                  {shipmentCarriers.map((carrier) => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tracking ID (Optional)</label>
              <Input
                value={formData.trackingId}
                onChange={(e) => setFormData((prev) => ({ ...prev, trackingId: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800">Diamond Sales</h3>
                <Button 
                  type="button" 
                  onClick={addSaleItem}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Diamond
                </Button>
              </div>

              {formData.saleItems.map((item, index) => (
                <div 
                  key={index} 
                  className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium">Diamond #{index + 1}</h4>
                    {formData.saleItems.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeSaleItem(index)}
                        variant="outline"
                        className="p-1 h-auto text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Carat <span className="text-red-500">*</span></label>
                      <Input
                        type="number"
                        value={item.carat}
                        onChange={(e) => updateSaleItemTotal(index, 'carat', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required={!isNoSale}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <Input
                        value={item.color}
                        onChange={(e) => updateSaleItemTotal(index, 'color', e.target.value)}
                        placeholder="E.g., D, E, F"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Clarity</label>
                      <Input
                        value={item.clarity}
                        onChange={(e) => updateSaleItemTotal(index, 'clarity', e.target.value)}
                        placeholder="E.g., VS1, SI2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Certificate No. <span className="text-red-500">*</span></label>
                      <Input
                        value={item.certificateNo}
                        onChange={(e) => updateSaleItemTotal(index, 'certificateNo', e.target.value)}
                        placeholder="Certificate number"
                        required={!isNoSale}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price Per Carat ($) <span className="text-red-500">*</span></label>
                      <Input
                        type="number"
                        value={item.pricePerCarat}
                        onChange={(e) => updateSaleItemTotal(index, 'pricePerCarat', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required={!isNoSale}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Total Value ($)</label>
                      <Input
                        type="number"
                        value={item.totalValue}
                        readOnly
                        className="bg-gray-50 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Sale Value ($)</label>
              <Input
                type="number"
                value={formData.totalSaleValue}
                readOnly
                className="bg-gray-50 font-medium text-lg"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any additional notes here..."
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Entry'}
        </Button>
      </form>
    </Card>
  )
}