"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { typedZodResolver } from "@/lib/utils/typed-zod-resolver";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DiamondStatus, type InventoryItem as PrismaInventoryItem } from "@prisma/client";
import { statusOptions } from "@/lib/utils/inventory";

// Define form data type
export type InventoryItemFormData = z.infer<typeof inventoryFormSchema>;

// Use the Prisma type
type InventoryItemType = PrismaInventoryItem;

const inventoryFormSchema = z.object({
  stockId: z.string().min(1, "Stock ID is required"),
  shape: z.string().min(1, "Shape is required"),
  size: z.coerce.number().positive("Carat must be a positive number"),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  cut: z.string().optional(),
  polish: z.string().optional().nullable(),
  sym: z.string().optional().nullable(),
  lab: z.string().optional().nullable(),
  certificateNo: z.string().optional().nullable(),
  pricePerCarat: z.coerce.number().nonnegative("Price per carat must be non-negative").optional().nullable(),
  finalAmount: z.coerce.number().nonnegative("Final amount must be non-negative"),
  videoUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  certUrl: z.string().optional().nullable(),
  measurement: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  ratio: z.coerce.number().nonnegative("Ratio must be non-negative").optional().nullable(),
  table: z.coerce.number().nonnegative("Table must be non-negative").optional().nullable(),
  depth: z.coerce.number().nonnegative("Depth must be non-negative").optional().nullable(),
  growthType: z.string().optional().nullable(),
  flourence: z.string().optional().nullable(),
  greenPricePerCarat: z.coerce.number().nonnegative("Green price per carat must be non-negative").optional().nullable(),
  greenPrice: z.coerce.number().nonnegative("Green price must be non-negative").optional().nullable(),
  redPricePerCarat: z.coerce.number().nonnegative("Red price per carat must be non-negative").optional().nullable(),
  redPrice: z.coerce.number().nonnegative("Red price must be non-negative").optional().nullable(),
  status: z.nativeEnum(DiamondStatus),
  heldByShipmentId: z.string().optional().nullable(),
});

interface ShipmentOption {
  id: string;
  companyName: string;
}

interface AddEditInventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItemType; // Use Prisma type, make optional for Add mode
  onSubmit: (data: InventoryItemFormData) => Promise<void>; // Use specific form data type
  isLoading: boolean;
  shipments: ShipmentOption[];
}

/** react-hook-form may pass null for optional fields; HTML inputs reject null. */
function inputValue(value: unknown): string | number {
  if (value === null || value === undefined) return "";
  return value as string | number;
}

export function AddEditInventoryForm({
  isOpen,
  onClose,
  item, // Use Prisma type
  onSubmit,
  isLoading,
  shipments,
}: AddEditInventoryFormProps) {
  const [isShipmentRequired, setIsShipmentRequired] = useState(false);
  
  const form = useForm<InventoryItemFormData>({
    resolver: typedZodResolver(inventoryFormSchema),
    defaultValues: {
      stockId: "",
      shape: "",
      size: undefined,
      color: "",
      clarity: "",
      cut: undefined,
      polish: "",
      sym: "",
      lab: "",
      pricePerCarat: undefined,
      finalAmount: 0,
      videoUrl: "",
      imageUrl: "",
      certUrl: "",
      measurement: "",
      location: "",
      ratio: undefined,
      table: undefined,
      depth: undefined,
      growthType: "",
      flourence: "",
      greenPricePerCarat: undefined,
      greenPrice: undefined,
      redPricePerCarat: undefined,
      redPrice: undefined,
      status: DiamondStatus.AVAILABLE,
      heldByShipmentId: undefined,
    },
  });
  
  const watchedSize = form.watch("size");
  const watchedPricePerCarat = form.watch("pricePerCarat");
  const watchedGreenPricePerCarat = form.watch("greenPricePerCarat");
  const watchedRedPricePerCarat = form.watch("redPricePerCarat");

  useEffect(() => {
    const sizeNum = typeof watchedSize === 'number' ? watchedSize : parseFloat(String(watchedSize || 0));
    const pricePerCaratNum = watchedPricePerCarat !== null && watchedPricePerCarat !== undefined
      ? (typeof watchedPricePerCarat === 'number' ? watchedPricePerCarat : parseFloat(String(watchedPricePerCarat)))
      : null;

    if (!isNaN(sizeNum) && pricePerCaratNum !== null && !isNaN(pricePerCaratNum) && sizeNum > 0 && pricePerCaratNum > 0) {
      const calculatedAmount = parseFloat((sizeNum * pricePerCaratNum).toFixed(2));
      form.setValue("finalAmount", calculatedAmount, { shouldValidate: true });
    } else {
      form.setValue("finalAmount", 0, { shouldValidate: true });
    }
  }, [watchedSize, watchedPricePerCarat, form.setValue, form]);

  // Auto-calculate green price total
  useEffect(() => {
    const sizeNum = typeof watchedSize === 'number' ? watchedSize : parseFloat(String(watchedSize || 0));
    const greenPricePerCaratNum = watchedGreenPricePerCarat !== null && watchedGreenPricePerCarat !== undefined
      ? (typeof watchedGreenPricePerCarat === 'number' ? watchedGreenPricePerCarat : parseFloat(String(watchedGreenPricePerCarat)))
      : null;

    if (!isNaN(sizeNum) && greenPricePerCaratNum !== null && !isNaN(greenPricePerCaratNum) && sizeNum > 0 && greenPricePerCaratNum > 0) {
      const calculatedGreenPrice = parseFloat((sizeNum * greenPricePerCaratNum).toFixed(2));
      form.setValue("greenPrice", calculatedGreenPrice, { shouldValidate: true });
    }
  }, [watchedSize, watchedGreenPricePerCarat, form.setValue, form]);

  // Auto-calculate red price total
  useEffect(() => {
    const sizeNum = typeof watchedSize === 'number' ? watchedSize : parseFloat(String(watchedSize || 0));
    const redPricePerCaratNum = watchedRedPricePerCarat !== null && watchedRedPricePerCarat !== undefined
      ? (typeof watchedRedPricePerCarat === 'number' ? watchedRedPricePerCarat : parseFloat(String(watchedRedPricePerCarat)))
      : null;

    if (!isNaN(sizeNum) && redPricePerCaratNum !== null && !isNaN(redPricePerCaratNum) && sizeNum > 0 && redPricePerCaratNum > 0) {
      const calculatedRedPrice = parseFloat((sizeNum * redPricePerCaratNum).toFixed(2));
      form.setValue("redPrice", calculatedRedPrice, { shouldValidate: true });
    }
  }, [watchedSize, watchedRedPricePerCarat, form.setValue, form]);
  
  useEffect(() => {
    if (item) {
      form.reset({
        stockId: item.stockId,
        shape: item.shape,
        size: item.size ?? undefined,
        color: item.color,
        clarity: item.clarity,
        cut: item.cut ?? undefined,
        polish: item.polish,
        sym: item.sym,
        lab: item.lab,
        pricePerCarat: item.pricePerCarat ?? undefined,
        finalAmount: item.finalAmount ?? undefined,
        videoUrl: item.videoUrl ?? "",
        imageUrl: item.imageUrl ?? "",
        certUrl: item.certUrl ?? "",
        measurement: (item as Record<string, unknown>).measurement as string ?? "",
        location: (item as Record<string, unknown>).location as string ?? "",
        ratio: (item as Record<string, unknown>).ratio as number ?? undefined,
        table: (item as Record<string, unknown>).table as number ?? undefined,
        depth: (item as Record<string, unknown>).depth as number ?? undefined,
        growthType: (item as Record<string, unknown>).growthType as string ?? "",
        flourence: (item as Record<string, unknown>).flourence as string ?? "",
        greenPricePerCarat: (item as Record<string, unknown>).greenPricePerCarat as number ?? undefined,
        greenPrice: (item as Record<string, unknown>).greenPrice as number ?? undefined,
        redPricePerCarat: (item as Record<string, unknown>).redPricePerCarat as number ?? undefined,
        redPrice: (item as Record<string, unknown>).redPrice as number ?? undefined,
        status: item.status,
        heldByShipmentId: item.heldByShipmentId ?? undefined,
      });
      setIsShipmentRequired(item.status === DiamondStatus.HOLD || item.status === DiamondStatus.MEMO || item.status === DiamondStatus.SOLD);
    } else {
      // Reset form for Add mode
      form.reset(); // Reset to defaultValues
      setIsShipmentRequired(false);
    }
  }, [item, form.reset, form.setValue, form]);
  
  const handleStatusChange = (value: string) => {
    form.setValue("status", value as "AVAILABLE" | "HOLD" | "MEMO" | "SOLD");
    setIsShipmentRequired(value === "HOLD" || value === "MEMO" || value === "SOLD");
    if (value === "AVAILABLE") {
      form.setValue("heldByShipmentId", null);
    }
  };
  
  const handleSubmit = async (data: z.infer<typeof inventoryFormSchema>) => {
    if ((data.status === "HOLD" || data.status === "MEMO" || data.status === "SOLD") && !data.heldByShipmentId) {
      form.setError("heldByShipmentId", {
        type: "manual",
        message: "Shipment is required for Hold, Memo, or Sold status",
      });
      return;
    }
    
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Update the details of the inventory item." 
              : "Fill in the details to add a new inventory item."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock ID*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter stock ID" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shape"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shape*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter shape" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carat*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter carat weight" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter color" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clarity*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter clarity" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cut</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter cut (optional)" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="polish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Polish*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter polish" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symmetry*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter symmetry" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="certificateNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter certificate number (optional)" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lab"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter lab" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricePerCarat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price/Ct*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter price per carat" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="finalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Calculated automatically" 
                        readOnly
                        className="bg-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter image URL" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter video URL" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="certUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter certificate URL" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="measurement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter measurement" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter location" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ratio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ratio</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter ratio" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="table"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter table" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depth</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter depth" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="growthType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Growth Type</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter growth type" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="flourence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fluorescence</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} value={inputValue(field.value)} 
                        placeholder="Enter fluorescence" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-green-700">Green Price</h3>
                <FormField
                  control={form.control}
                  name="greenPricePerCarat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Green Price/Ct</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} value={inputValue(field.value)} 
                          placeholder="Enter green price per carat" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="greenPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Green Price (Total)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} value={inputValue(field.value)} 
                          placeholder="Enter green price total" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-red-700">Red Price</h3>
                <FormField
                  control={form.control}
                  name="redPricePerCarat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Red Price/Ct</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} value={inputValue(field.value)} 
                          placeholder="Enter red price per carat" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="redPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Red Price (Total)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} value={inputValue(field.value)} 
                          placeholder="Enter red price total" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={handleStatusChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isShipmentRequired && (
                <FormField
                  control={form.control}
                  name="heldByShipmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company*</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {field.value
                              ? shipments.find((shipment) => shipment.id === field.value)?.companyName || "Select company"
                              : <SelectValue placeholder="Select company" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shipments.map((shipment) => (
                            <SelectItem key={shipment.id} value={shipment.id}>
                              {shipment.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner />
                ) : null}
                {item ? "Update" : "Add"} Inventory
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}