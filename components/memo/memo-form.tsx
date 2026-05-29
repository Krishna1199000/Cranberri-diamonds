"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { typedZodResolver } from "@/lib/utils/typed-zod-resolver";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trash2, Search, Check } from "lucide-react";
import { cn, calculateTotal, formatCurrency, generateMemoNumber } from "@/lib/utils"; // Import generateMemoNumber from utils
import { format } from "date-fns";
import { MemoFormValues, memoFormSchema } from "@/lib/validators/memo"; // Import memo schema and types
import { isInventoryStockId } from "@/lib/utils/pricing-tiers";

import { toast } from "sonner";
import { MemoPreview } from "./memo-preview"; // Import MemoPreview (to be created)
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter
import { clearCart } from "@/lib/utils/cart";

// Type for shipment data (reusable or import)
interface ShipmentForMemo {
  id: string;
  companyName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}



// Add props interface for initialData
interface MemoFormProps {
  initialData?: (MemoFormValues & { id: string; memoNo: string }) | null; 
}

// Rename component and accept props
export function MemoForm({ initialData }: MemoFormProps) {
    const router = useRouter(); // Initialize router
    const searchParams = useSearchParams();
    const fromCart = searchParams.get("fromCart") === "true";
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Update preview data type for Memo
    const [previewData, setPreviewData] = useState<(MemoFormValues & { id?: string; memoNo?: string; companyName?: string; addressLine1?: string; addressLine2?: string | null; city?: string; state?: string; country?: string; postalCode?: string; totalAmount?: number; subtotal?: number; }) | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [lastMemoNo, setLastMemoNo] = useState<string | null>(null); // Renamed state
    const [memoNoLoading, setMemoNoLoading] = useState(true); // Renamed state
    const [shipmentsList, setShipmentsList] = useState<ShipmentForMemo[]>([]);
    const [shipmentsLoading, setShipmentsLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventorySearchInput, setInventorySearchInput] = useState("");
    const [inventorySearch, setInventorySearch] = useState("");
    const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
    const [inventoryPopoverOpen, setInventoryPopoverOpen] = useState(false);

    // Use MemoFormValues and memoFormSchema - MOVED TO TOP
    const form = useForm<MemoFormValues>({
        resolver: typedZodResolver(memoFormSchema),
        defaultValues: initialData ? {
            ...initialData,
            date: initialData.date instanceof Date ? initialData.date : new Date(initialData.date),
            dueDate: initialData.dueDate instanceof Date ? initialData.dueDate : new Date(initialData.dueDate),
        } : {
            memoNo: "",
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            paymentTerms: 7,
            shipmentId: "",
            description: "MemoRandum",
            shipmentCost: 0,
            discount: 0,
            crPayment: 0,
            items: [
                {
                    description: "",
                    carat: 0.01,
                    color: "",
                    clarity: "",
                    lab: "",
                    reportNo: "",
                    stockId: "",
                    pricePerCarat: 0.01,
                    enteredPricePerCarat: 0.01,
                },
            ],
        }
    });

    // Fetch latest memo number (TODO: Create this API endpoint)
    // Check for pre-filled data from inventory selection
    useEffect(() => {
      const prefilledData = sessionStorage.getItem('prefilledMemoData');
      if (prefilledData) {
        try {
          const data = JSON.parse(prefilledData);
          // Set form values from pre-filled data
          form.reset(data);
          // Clear the session storage
          sessionStorage.removeItem('prefilledMemoData');
        } catch (error) {
          console.error('Error parsing pre-filled memo data:', error);
          toast.error('Failed to load pre-filled data');
        }
      }
    }, [form]);

    useEffect(() => {
        setMemoNoLoading(true);
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.log("Memo number fetch timeout - continuing with default");
            setMemoNoLoading(false);
            setLastMemoNo(null);
        }, 10000); // 10 second timeout
        
        fetch("/api/memos/latest-number") // Updated API endpoint
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                // Expect `lastMemoNo` from the API
                if (data.lastMemoNo) {
                    setLastMemoNo(data.lastMemoNo);
                } else {
                    setLastMemoNo(null);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch latest memo number:", error);
                // Don't show error toast for this - it's not critical for button functionality
                console.log("Continuing without latest memo number - will use default");
                setLastMemoNo(null);
            })
            .finally(() => {
                clearTimeout(timeoutId);
                setMemoNoLoading(false);
            });
    }, []);

    // Fetch shipments (remains the same)
    useEffect(() => {
        const fetchShipments = async () => {
            setShipmentsLoading(true);
            
            // Add timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                console.log("Shipments fetch timeout - continuing with empty list");
                setShipmentsLoading(false);
                setShipmentsList([]);
            }, 15000); // 15 second timeout
            
            try {
                const response = await fetch("/api/shipments");
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success && Array.isArray(data.shipments)) {
                    const validShipments = data.shipments.filter(
                        (s: ShipmentForMemo) => s.id && s.companyName && s.addressLine1 && s.city && s.state && s.country && s.postalCode
                    );
                    setShipmentsList(validShipments as ShipmentForMemo[]);
                } else {
                    throw new Error(data.message || "Failed to fetch shipments list");
                }
            } catch (error) {
                console.error("Failed to fetch shipments list:", error);
                toast.error(error instanceof Error ? error.message : "Could not load company list.");
                setShipmentsList([]);
            } finally {
                clearTimeout(timeoutId);
                setShipmentsLoading(false);
            }
        };
        fetchShipments();
    }, []);

    // Fetch inventory items
    useEffect(() => {
        const fetchInventory = async () => {
            setInventoryLoading(true);
            try {
                const response = await fetch("/api/inventory-items?take=1000");
                const data = await response.json();
                if (data.items) {
                    setInventoryItems(data.items);
                }
            } catch (error) {
                console.error("Failed to fetch inventory:", error);
                toast.error("Failed to load inventory items");
            } finally {
                setInventoryLoading(false);
            }
        };
        fetchInventory();
    }, []);

    // Filter inventory items based on search
    const filteredInventoryItems = inventoryItems.filter(item => {
        if (!inventorySearch) return true;
        const searchLower = inventorySearch.toLowerCase();
        return (
            item.stockId?.toLowerCase().includes(searchLower) ||
            item.shape?.toLowerCase().includes(searchLower) ||
            item.color?.toLowerCase().includes(searchLower) ||
            item.clarity?.toLowerCase().includes(searchLower)
        );
    });

    // Handle adding selected inventory items to form
    const handleAddInventoryItems = () => {
        if (selectedStockIds.length === 0) {
            toast.error("Please select at least one inventory item");
            return;
        }

        const selectedItems = inventoryItems.filter(item => 
            selectedStockIds.includes(item.stockId)
        );

        // Clear existing items first
        const currentItems = form.getValues("items");
        if (currentItems.length === 1 && !currentItems[0].description && !currentItems[0].stockId) {
            remove(0);
        }

        // Add selected items
        selectedItems.forEach(item => {
            append({
                description: `${item.shape || ''} ${item.size || 0}ct ${item.color || ''} ${item.clarity || ''}`.trim(),
                carat: item.size || 0.01,
                color: item.color || '',
                clarity: item.clarity || '',
                lab: item.lab || '',
                reportNo: item.certificateNo || item.stockId || '',
                stockId: item.stockId || '',
                pricePerCarat: item.pricePerCarat || 0.01,
                enteredPricePerCarat: item.pricePerCarat || 0.01,
            });
        });

        // Clear selection and close popover
        setSelectedStockIds([]);
        setInventoryPopoverOpen(false);
        setInventorySearchInput("");
        setInventorySearch("");
        toast.success(`Added ${selectedItems.length} item(s) to memo`);
    };

    const handleInventorySearch = () => {
        setInventorySearch(inventorySearchInput.trim());
    };

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Generate and set memo number ONLY IF creating a new memo
    const watchedDate = form.watch("date");
    useEffect(() => {
        if (!initialData) { // Only generate for new memos
           const currentMemoDate = form.getValues("date");
           if (!memoNoLoading && currentMemoDate) {
               const newMemoNo = generateMemoNumber(lastMemoNo, currentMemoDate);
               form.setValue("memoNo", newMemoNo); // Set memoNo
           }
        }
    }, [lastMemoNo, memoNoLoading, watchedDate, form, initialData]);

    // Update onSubmit for Memos (handles both Create and Update)
    const onSubmit = async (data: MemoFormValues) => {
        try {
            setIsSubmitting(true);

            // Determine method and URL based on whether we are editing
            const isEditing = !!initialData;
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `/api/memos/${initialData.id}` : '/api/memos';

            // Check memoNo if creating
            if (!isEditing && !data.memoNo) {
                 toast.error("Memo number could not be generated.");
                 setIsSubmitting(false);
                 return;
            }

            // Ensure numeric fields are numbers
            const submissionData = {
                ...data,
                // Don't send memoNo when updating (usually shouldn't change)
                memoNo: isEditing ? undefined : data.memoNo, 
                shipmentCost: Number(data.shipmentCost) || 0,
                discount: Number(data.discount) || 0,
                crPayment: Number(data.crPayment) || 0,
                 // Ensure items have numeric values where expected for API
                items: data.items.map(item => ({
                    ...item,
                    carat: Number(item.carat) || 0,
                    pricePerCarat: Number(item.pricePerCarat) || 0,
                    enteredPricePerCarat: item.enteredPricePerCarat != null
                      ? Number(item.enteredPricePerCarat)
                      : undefined,
                    // Include ID if it exists (for PUT to potentially identify items? - check API PUT logic)
                    id: item.id, 
                }))
            };

            // Send request
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const action = isEditing ? 'update' : 'create';
                 if (response.status === 409) {
                    throw new Error(errorData.error || 'Memo number conflict. Please refresh and try again.');
                } else if (response.status === 400) {
                    throw new Error(errorData.error || 'Invalid data or company not found.');
                } else if (response.status === 404 && isEditing) {
                    throw new Error(errorData.error || 'Memo not found for update.');
                } else if (response.status === 403 && isEditing) {
                     throw new Error(errorData.error || 'You do not have permission to update this memo.');
                } else {
                    throw new Error(errorData.error || `Failed to ${action} memo`);
                }
            }

            const result = await response.json();

            if (isEditing) {
                 toast.success("Memo updated successfully: " + initialData.memoNo);
                 // Redirect to the view page after successful update
                 router.push(`/memos/${initialData.id}`);
                 router.refresh(); // Optional: force refresh if needed
            } else {
                 // Existing logic for creation success
                 if (!result.memo || !result.memo.id || !result.memo.companyName || !result.memo.addressLine1) {
                    console.error("API response missing expected memo details:", result);
                    throw new Error("Memo created, but failed to retrieve complete details for preview.");
                }
                toast.success("Memo created successfully: " + result.memo.memoNo); // Use memoNo

                if (fromCart) {
                    try {
                        const userRes = await fetch("/api/auth/me", { credentials: "include" });
                        if (userRes.ok) {
                            const user = await userRes.json();
                            clearCart(user.id);
                        }
                    } catch {
                        // non-blocking
                    }
                }

                setLastMemoNo(result.memo.memoNo); // Update lastMemoNo
                setPreviewData({
                    ...submissionData,
                    ...result.memo,
                    id: result.memo.id,
                    memoNo: result.memo.memoNo, // Use memoNo
                    companyName: result.memo.companyName,
                    addressLine1: result.memo.addressLine1,
                    addressLine2: result.memo.addressLine2,
                    city: result.memo.city,
                    state: result.memo.state,
                    country: result.memo.country,
                    postalCode: result.memo.postalCode,
                    totalAmount: result.memo.totalAmount,
                    subtotal: result.memo.subtotal,
                });
                setShowPreview(true);
            }

        } catch (error) {
            const action = initialData ? 'updating' : 'creating';
            console.error(`Error ${action} memo:`, error);
            toast.error(error instanceof Error ? error.message : `Failed to ${action} memo`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateItemTotal = (carat: number, pricePerCarat: number) => {
        return calculateTotal(carat, pricePerCarat);
    };

    const calculateSubtotal = () => {
        const values = form.getValues();
        return values.items.reduce((total, item) => {
            return total + calculateItemTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
        }, 0);
    };

    const calculateGrandTotal = () => {
        const values = form.getValues();
        const subtotal = calculateSubtotal();
        const discount = Number(values.discount) || 0;
        const crPayment = Number(values.crPayment) || 0;
        const shipmentCost = Number(values.shipmentCost) || 0;
        return subtotal - discount - crPayment + shipmentCost;
    };

    // Use MemoPreview
    if (showPreview && previewData) {
        return (
            <div className="space-y-4">
                <MemoPreview memo={previewData} /> 
            </div>
        );
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Memo Number Field */}
                    <div className="space-y-2">
                        <Label htmlFor="memoNo">Memo No.</Label> 
                        <Input
                            id="memoNo" 
                            readOnly
                            {...form.register("memoNo")} // Register memoNo
                            value={memoNoLoading ? "Generating..." : form.watch("memoNo")} // Watch memoNo
                            className="bg-gray-100"
                        />
                        {/* Update error field name */} 
                        {form.formState.errors.memoNo && (
                            <p className="text-sm text-red-500">{form.formState.errors.memoNo.message}</p>
                        )}
                    </div>

                    {/* Date Field (same logic) */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Controller
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    field.onChange(date);
                                                    const terms = form.getValues("paymentTerms");
                                                    if (terms) {
                                                        const newDueDate = new Date(date);
                                                        newDueDate.setDate(date.getDate() + Number(terms));
                                                        form.setValue("dueDate", newDueDate);
                                                    }
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {form.formState.errors.date && (
                            <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
                        )}
                    </div>

                    {/* Due Date Field (same logic) */}
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Controller
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a due date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    field.onChange(date);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {form.formState.errors.dueDate && (
                            <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                        )}
                    </div>

                     {/* Payment Terms Field (same logic) */}
                     <div className="space-y-2">
                        <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                        <Input
                            id="paymentTerms"
                            type="number"
                            min="1"
                            {...form.register("paymentTerms", {
                                 valueAsNumber: true,
                                 onChange: (e) => {
                                     const terms = parseInt(e.target.value);
                                     form.setValue("paymentTerms", terms);
                                     const currentMemoDate = form.getValues("date"); // Use memo date
                                     if (currentMemoDate && !isNaN(terms) && terms > 0) {
                                        const newDueDate = new Date(currentMemoDate);
                                        newDueDate.setDate(currentMemoDate.getDate() + terms);
                                        form.setValue("dueDate", newDueDate);
                                     }
                                 }
                            })}
                        />
                        {form.formState.errors.paymentTerms && (
                            <p className="text-sm text-red-500">{form.formState.errors.paymentTerms.message}</p>
                        )}
                    </div>

                     {/* Company Selection (same logic) */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="shipmentId">Company (Select from Shipments)</Label>
                        <Controller
                            control={form.control}
                            name="shipmentId"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={shipmentsLoading}
                                >
                                    <SelectTrigger>
                                        {field.value 
                                            ? shipmentsList.find(s => s.id === field.value)?.companyName 
                                            : <span className="text-muted-foreground">{shipmentsLoading ? "Loading companies..." : "Select a company"}</span>
                                        }
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shipmentsLoading ? (
                                            <p className="p-2 text-sm text-muted-foreground">Loading...</p>
                                        ) : shipmentsList.length > 0 ? (
                                            shipmentsList.map((shipment) => (
                                                <SelectItem key={shipment.id} value={shipment.id}>
                                                    {shipment.companyName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                           <p className="p-2 text-sm text-muted-foreground">No companies found.</p>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.shipmentId && (
                            <p className="text-sm text-red-500">{form.formState.errors.shipmentId.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Memo Items</h3>
                            <Popover open={inventoryPopoverOpen} onOpenChange={setInventoryPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className="flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        Add from Inventory
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 p-4" align="end">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Search Inventory</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Search by Stock ID, Shape, Color, Clarity..."
                                                    value={inventorySearchInput}
                                                    onChange={(e) => setInventorySearchInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleInventorySearch();
                                                        }
                                                    }}
                                                />
                                                <Button type="button" variant="outline" onClick={handleInventorySearch}>
                                                    Search
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
                                            {inventoryLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : filteredInventoryItems.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No inventory items found
                                                </p>
                                            ) : (
                                                filteredInventoryItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                                                    >
                                                        <Checkbox
                                                            id={`memo-inventory-${item.id}`}
                                                            checked={selectedStockIds.includes(item.stockId)}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                if (isChecked) {
                                                                    setSelectedStockIds([...selectedStockIds, item.stockId]);
                                                                } else {
                                                                    setSelectedStockIds(selectedStockIds.filter(id => id !== item.stockId));
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`memo-inventory-${item.id}`}
                                                            className="flex-1 text-sm cursor-pointer"
                                                        >
                                                            <div className="font-medium">{item.stockId}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {item.shape} {item.size}ct {item.color} {item.clarity}
                                                            </div>
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                {selectedStockIds.length} selected
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={handleAddInventoryItems}
                                                disabled={selectedStockIds.length === 0}
                                                className="flex items-center gap-2"
                                            >
                                                <Check className="h-4 w-4" />
                                                Add Selected
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Memo items section (same structure) */}
                        {fields.map((field, index) => (
                            <div key={field.id} className="border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Item #{index + 1}</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            if (fields.length > 1) {
                                                remove(index);
                                            } else {
                                                toast.error("You must have at least one item");
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Fields for each item (remain largely the same) */} 
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.description`}>Description</Label>
                                        <Input
                                            id={`items.${index}.description`}
                                            {...form.register(`items.${index}.description`)}
                                        />
                                        {form.formState.errors.items?.[index]?.description && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.description?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Carat */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.carat`}>Carat</Label>
                                        <Input
                                            id={`items.${index}.carat`}
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            {...form.register(`items.${index}.carat`, { 
                                                valueAsNumber: true,
                                                setValueAs: v => Number(v) || 0.01
                                            })}
                                        />
                                        {form.formState.errors.items?.[index]?.carat && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.carat?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Color */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.color`}>Color</Label>
                                        <Input
                                            id={`items.${index}.color`}
                                            {...form.register(`items.${index}.color`)}
                                        />
                                        {form.formState.errors.items?.[index]?.color && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.color?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Clarity */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.clarity`}>Clarity</Label>
                                        <Input
                                            id={`items.${index}.clarity`}
                                            {...form.register(`items.${index}.clarity`)}
                                        />
                                        {form.formState.errors.items?.[index]?.clarity && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.clarity?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Lab */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.lab`}>Lab</Label>
                                        <Input
                                            id={`items.${index}.lab`}
                                            {...form.register(`items.${index}.lab`)}
                                        />
                                        {form.formState.errors.items?.[index]?.lab && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.lab?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Report No */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.reportNo`}>Report No.</Label>
                                        <Input
                                            id={`items.${index}.reportNo`}
                                            {...form.register(`items.${index}.reportNo`)}
                                        />
                                        {form.formState.errors.items?.[index]?.reportNo && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.reportNo?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Stock ID */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.stockId`}>Stock ID</Label>
                                        <Input
                                            id={`items.${index}.stockId`}
                                            {...form.register(`items.${index}.stockId`)}
                                            placeholder="Optional Stock ID"
                                        />
                                        {form.formState.errors.items?.[index]?.stockId && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.stockId?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Price/ct */}
                                    <div className="space-y-2">
                                        {isInventoryStockId(form.watch(`items.${index}.stockId`)) ? (
                                          <>
                                            <Label htmlFor={`items.${index}.pricePerCarat`}>Asking Price/ct (USD)</Label>
                                            <Input
                                              id={`items.${index}.pricePerCarat`}
                                              type="number"
                                              step="0.01"
                                              readOnly
                                              className="bg-muted"
                                              {...form.register(`items.${index}.pricePerCarat`, {
                                                valueAsNumber: true,
                                                setValueAs: (v) => Number(v) || 0.01,
                                              })}
                                            />
                                            <Label htmlFor={`items.${index}.enteredPricePerCarat`}>Entered Price/ct (USD)</Label>
                                            <Input
                                              id={`items.${index}.enteredPricePerCarat`}
                                              type="number"
                                              step="0.01"
                                              min="0.01"
                                              {...form.register(`items.${index}.enteredPricePerCarat`, {
                                                valueAsNumber: true,
                                                setValueAs: (v) => Number(v) || 0.01,
                                              })}
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <Label htmlFor={`items.${index}.pricePerCarat`}>Price/ct (USD)</Label>
                                            <Input
                                              id={`items.${index}.pricePerCarat`}
                                              type="number"
                                              step="0.01"
                                              min="0.01"
                                              {...form.register(`items.${index}.pricePerCarat`, {
                                                valueAsNumber: true,
                                                setValueAs: (v) => Number(v) || 0.01,
                                              })}
                                            />
                                          </>
                                        )}
                                        {form.formState.errors.items?.[index]?.pricePerCarat && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.pricePerCarat?.message}
                                            </p>
                                        )}
                                    </div>
                                    {/* Total (calculated display) */}
                                    <div className="space-y-2">
                                        <Label>Total</Label>
                                        <div className="h-10 px-3 py-2 border rounded-md flex items-center bg-muted">
                                            {formatCurrency(
                                                calculateItemTotal(
                                                    Number(form.watch(`items.${index}.carat`)) || 0,
                                                    Number(form.watch(`items.${index}.pricePerCarat`)) || 0
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div> 
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                append({
                                    description: "",
                                    carat: 0.01,
                                    color: "",
                                    clarity: "",
                                    lab: "",
                                    reportNo: "",
                                    stockId: "",
                                    pricePerCarat: 0.01,
                                    enteredPricePerCarat: 0.01,
                                })
                            }
                        >
                            Add Item
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Financials and Description Card (same structure, use memo description default) */}
            <Card>
                 <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                         <Label htmlFor="description">Description (Optional)</Label>
                         <Textarea
                             id="description"
                             placeholder="Memo details or notes" // Update placeholder
                             {...form.register("description")} // Register description
                         />
                     </div>

                     <div className="space-y-4">
                        {/* Financial inputs (same structure) */} 
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <Label htmlFor="shipmentCost">Shipment Cost</Label>
                                 <Input id="shipmentCost" type="number" step="0.01" min="0" {...form.register("shipmentCost", { valueAsNumber: true, setValueAs: v => Number(v) || 0 })} placeholder="0.00" />
                                 {form.formState.errors.shipmentCost && <p className="text-xs text-red-500">{form.formState.errors.shipmentCost.message}</p>}
                             </div>
                             <div className="space-y-2">
                                 <Label htmlFor="discount">Discount</Label>
                                 <Input id="discount" type="number" step="0.01" min="0" {...form.register("discount", { valueAsNumber: true, setValueAs: v => Number(v) || 0 })} placeholder="0.00" />
                                  {form.formState.errors.discount && <p className="text-xs text-red-500">{form.formState.errors.discount.message}</p>}
                             </div>
                             <div className="space-y-2">
                                 <Label htmlFor="crPayment">CR/Payment</Label>
                                 <Input id="crPayment" type="number" step="0.01" min="0" {...form.register("crPayment", { valueAsNumber: true, setValueAs: v => Number(v) || 0 })} placeholder="0.00" />
                                 {form.formState.errors.crPayment && <p className="text-xs text-red-500">{form.formState.errors.crPayment.message}</p>}
                             </div>
                             <div></div> 
                        </div>
                        {/* Totals Display (same logic) */}
                        <div className="space-y-2 pt-4 border-t">
                             <div className="flex justify-between">
                                 <span className="text-muted-foreground">Subtotal</span>
                                 <span>{formatCurrency(calculateSubtotal())}</span>
                             </div>
                            <div className="flex justify-between font-bold text-lg">
                                 <span>Total Due</span>
                                 <span>{formatCurrency(calculateGrandTotal())}</span>
                             </div>
                         </div>
                     </div>
                 </CardContent>
             </Card>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 print:hidden">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                </Button>
                <Button type="submit" disabled={isSubmitting || memoNoLoading || shipmentsLoading}> {/* Use memoNoLoading */} 
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (memoNoLoading && !initialData || shipmentsLoading) ? ( /* Disable if loading OR creating and memoNo isn't ready */
                         <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                         </>
                    ) : (
                         initialData ? "Update Memo" : "Generate Memo" // Change button text
                    )}
                </Button>
            </div>
        </form>
    );
} 