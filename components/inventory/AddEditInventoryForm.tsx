"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  polish: z.string().min(1, "Polish is required"),
  sym: z.string().min(1, "Symmetry is required"),
  lab: z.string().min(1, "Lab is required"),
  pricePerCarat: z.coerce.number().positive("Price per carat must be positive"),
  finalAmount: z.coerce.number().positive("Final amount must be positive"),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  certUrl: z.string().url("Invalid certificate URL").optional().nullable(),
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
    resolver: zodResolver(inventoryFormSchema),
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
      finalAmount: undefined,
      videoUrl: "",
      imageUrl: "",
      certUrl: "",
      status: DiamondStatus.AVAILABLE,
      heldByShipmentId: undefined,
    },
  });
  
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
        status: item.status,
        heldByShipmentId: item.heldByShipmentId ?? undefined,
      });
      setIsShipmentRequired(item.status === DiamondStatus.HOLD || item.status === DiamondStatus.MEMO);
    } else {
      // Reset form for Add mode
      form.reset(); // Reset to defaultValues
      setIsShipmentRequired(false);
    }
  }, [item, form]);
  
  const handleStatusChange = (value: string) => {
    form.setValue("status", value as "AVAILABLE" | "HOLD" | "MEMO");
    setIsShipmentRequired(value === "HOLD" || value === "MEMO");
    if (value === "AVAILABLE") {
      form.setValue("heldByShipmentId", null);
    }
  };
  
  const handleSubmit = async (data: z.infer<typeof inventoryFormSchema>) => {
    if ((data.status === "HOLD" || data.status === "MEMO") && !data.heldByShipmentId) {
      form.setError("heldByShipmentId", {
        type: "manual",
        message: "Shipment is required for Hold or Memo status",
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
                        {...field} 
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
                        {...field} 
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
                        {...field} 
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
                        {...field} 
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
                        {...field} 
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
                        {...field} 
                        value={field.value || ""} 
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
                        {...field} 
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
                        {...field} 
                        placeholder="Enter symmetry" 
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
                        {...field} 
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
                        {...field} 
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
                        {...field} 
                        placeholder="Enter final amount" 
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
                        {...field} 
                        value={field.value || ""} 
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
                        {...field} 
                        value={field.value || ""} 
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
                        {...field} 
                        value={field.value || ""} 
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
                            <SelectValue placeholder="Select company" />
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