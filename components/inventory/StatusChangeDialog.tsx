"use client";

import { useState } from "react";
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
import { statusOptions } from "@/lib/utils/inventory";
import { LoadingSpinner } from "@/components/LoadingSpinner";
// Import Prisma types
import type { InventoryItem as PrismaInventoryItem } from "@prisma/client";
import { DiamondStatus } from "@prisma/client"; // Import enum from Prisma

// Use the Prisma type
type InventoryItemType = PrismaInventoryItem;

// Define LoadingSpinner with className prop
// const LoadingSpinner = (props: { className?: string }) => (
//   <svg
//     className={props.className}
//     xmlns="http://www.w3.org/2000/svg"
//     width="24"
//     height="24"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M21 12a9 9 0 1 1-6.219-8.56" />
//   </svg>
// );

// REMOVED this interface as InventoryItemType is used
// interface InventoryItem {
//   id: string;
//   stockId: string;
//   status: string;
//   heldByShipmentId: string | null;
// }

const statusChangeSchema = z.object({
  status: z.nativeEnum(DiamondStatus),
  heldByShipmentId: z.string().optional().nullable(),
});

interface ShipmentOption {
  id: string;
  companyName: string;
}

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemType;
  onSubmit: (id: string, data: { status: DiamondStatus; heldByShipmentId: string | null }) => Promise<void>;
  isLoading: boolean;
  shipments: ShipmentOption[];
}

export function StatusChangeDialog({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading,
  shipments,
}: StatusChangeDialogProps) {
  const [isShipmentRequired, setIsShipmentRequired] = useState(
    item.status === DiamondStatus.HOLD || item.status === DiamondStatus.MEMO || item.status === DiamondStatus.SOLD
  );
  
  const form = useForm<z.infer<typeof statusChangeSchema>>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      status: item.status,
      heldByShipmentId: item.heldByShipmentId || null,
    },
  });
  
  const handleStatusChange = (value: string) => {
    const newStatus = value as DiamondStatus;
    form.setValue("status", newStatus);
    setIsShipmentRequired(newStatus === DiamondStatus.HOLD || newStatus === DiamondStatus.MEMO || newStatus === DiamondStatus.SOLD);
    if (newStatus === DiamondStatus.AVAILABLE) {
      form.setValue("heldByShipmentId", null);
    }
  };
  
  const handleSubmit = async (data: z.infer<typeof statusChangeSchema>) => {
    if ((data.status === DiamondStatus.HOLD || data.status === DiamondStatus.MEMO || data.status === DiamondStatus.SOLD) && !data.heldByShipmentId) {
      form.setError("heldByShipmentId", {
        type: "manual",
        message: "Company is required for Hold, Memo, or Sold status",
      });
      return;
    }
    
    try {
      await onSubmit(item.id, {
        status: data.status,
        heldByShipmentId: data.heldByShipmentId || null,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update the status of diamond {item.stockId}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                            ? shipments.find(s => s.id === field.value)?.companyName 
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : null}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}