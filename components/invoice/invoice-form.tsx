"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn, calculateTotal, formatCurrency, generateInvoiceNumber } from "@/lib/utils";
import { format } from "date-fns";
import { InvoiceFormValues, invoiceFormSchema } from "@/lib/validators/invoice";
import { toast } from "sonner";
import { InvoicePreview } from "./invoice-preview";
import { SubmitHandler } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Define a type for the fetched shipment data needed for the dropdown & preview
interface ShipmentForInvoice {
  id: string;
  companyName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export function InvoiceForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewData, setPreviewData] = useState<(InvoiceFormValues & { id?: string; companyName?: string; addressLine1?: string; addressLine2?: string | null; city?: string; state?: string; country?: string; postalCode?: string; totalAmount?: number; subtotal?: number; }) | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [lastInvoiceNo, setLastInvoiceNo] = useState<string | null>(null);
    const [invoiceNoLoading, setInvoiceNoLoading] = useState(true);
    const [shipmentsList, setShipmentsList] = useState<ShipmentForInvoice[]>([]);
    const [shipmentsLoading, setShipmentsLoading] = useState(true);

    const defaultValues: InvoiceFormValues = {
        invoiceNo: "",
        date: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        paymentTerms: 7,
        shipmentId: "",
        description: "",
        shipmentCost: 0,
        discount: 0,
        crPayment: 0,
        emailEnabled: true,
        items: [
            {
                description: "",
                carat: 0.01,
                color: "",
                clarity: "",
                lab: "",
                reportNo: "",
                pricePerCarat: 0.01,
            },
        ],
    };

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues
    });

    // Check for pre-filled data from inventory selection
    useEffect(() => {
      const prefilledData = sessionStorage.getItem('prefilledInvoiceData');
      if (prefilledData) {
        try {
          const data = JSON.parse(prefilledData);
          // Set form values from pre-filled data
          form.reset(data);
          // Clear the session storage
          sessionStorage.removeItem('prefilledInvoiceData');
        } catch (error) {
          console.error('Error parsing pre-filled invoice data:', error);
          toast.error('Failed to load pre-filled data');
        }
      }
    }, [form]);

    useEffect(() => {
        // Fetch the latest invoice *number* string
        setInvoiceNoLoading(true);
        fetch("/api/invoices/latest-number")
            .then((res) => res.json())
            .then((data) => {
                if (data.lastInvoiceNo) {
                    setLastInvoiceNo(data.lastInvoiceNo);
                } else {
                    setLastInvoiceNo(null);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch latest invoice number:", error);
                toast.error("Could not fetch latest invoice number.");
                setLastInvoiceNo(null);
            })
            .finally(() => {
                setInvoiceNoLoading(false);
            });
    }, []);

    useEffect(() => {
        const fetchShipments = async () => {
            setShipmentsLoading(true);
            try {
                const response = await fetch("/api/shipments"); // Assuming this fetches all needed fields
                const data = await response.json();
                if (data.success && Array.isArray(data.shipments)) {
                    // Filter out any shipments missing essential info for the dropdown/invoice
                    const validShipments = data.shipments.filter(
                        (s: ShipmentForInvoice) => s.id && s.companyName && s.addressLine1 && s.city && s.state && s.country && s.postalCode
                    );
                    setShipmentsList(validShipments as ShipmentForInvoice[]);
                } else {
                    throw new Error(data.message || "Failed to fetch shipments list");
                }
            } catch (error) {
                console.error("Failed to fetch shipments list:", error);
                toast.error(error instanceof Error ? error.message : "Could not load company list.");
                setShipmentsList([]);
            } finally {
                setShipmentsLoading(false);
            }
        };
        fetchShipments();
    }, []);


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Generate and set invoice number when lastInvoiceNo is loaded and date changes
    const watchedDate = form.watch("date");
    useEffect(() => {
        const currentInvoiceDate = form.getValues("date");
        if (!invoiceNoLoading && currentInvoiceDate) {
            const newInvoiceNo = generateInvoiceNumber(lastInvoiceNo, currentInvoiceDate);
            form.setValue("invoiceNo", newInvoiceNo);
        }
    }, [lastInvoiceNo, invoiceNoLoading, watchedDate, form]);

    const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
        try {
            setIsSubmitting(true);

            // The invoiceNo should be set by the useEffect hook
            if (!data.invoiceNo) {
                 toast.error("Invoice number could not be generated.");
                 setIsSubmitting(false);
                 return;
            }

            // Ensure numeric fields are numbers, default to 0 if empty/NaN
            const submissionData = {
                ...data,
                shipmentCost: Number(data.shipmentCost) || 0,
                discount: Number(data.discount) || 0,
                crPayment: Number(data.crPayment) || 0
            };

            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    throw new Error(errorData.error || 'Invoice number conflict. Please refresh and try again.');
                } else if (response.status === 400) {
                    throw new Error(errorData.error || 'Invalid data or company not found.');
                } else {
                    throw new Error(errorData.error || 'Failed to create invoice');
                }
            }

            const result = await response.json();
            if (!result.invoice || !result.invoice.id || !result.invoice.companyName || !result.invoice.addressLine1) {
                console.error("API response missing expected invoice details (incl. address):", result);
                throw new Error("Invoice created, but failed to retrieve complete details for preview.");
            }
            
            // Show success message with email status
            if (result.emailSent) {
                toast.success(`Invoice ${result.invoice.invoiceNo} created and emailed successfully!`);
            } else {
                toast.success(`Invoice ${result.invoice.invoiceNo} created successfully!`);
                if (result.message && result.message.includes('email not sent')) {
                    toast.warning("Note: Email notification was not sent. Please check the company's email address.");
                }
            }
            setLastInvoiceNo(result.invoice.invoiceNo);
            setPreviewData({
                ...submissionData,
                ...result.invoice,
                id: result.invoice.id,
                invoiceNo: result.invoice.invoiceNo,
                companyName: result.invoice.companyName,
                addressLine1: result.invoice.addressLine1,
                addressLine2: result.invoice.addressLine2,
                city: result.invoice.city,
                state: result.invoice.state,
                country: result.invoice.country,
                postalCode: result.invoice.postalCode,
                totalAmount: result.invoice.totalAmount,
                subtotal: result.invoice.subtotal,
            });
            setShowPreview(true);

        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateItemTotal = (carat: number, pricePerCarat: number) => {
        return calculateTotal(carat, pricePerCarat);
    };

    // Calculate subtotal - just the item totals
    const calculateSubtotal = () => {
        const values = form.getValues();
        return values.items.reduce((total, item) => {
            return total + calculateItemTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
        }, 0);
    };

    // Calculate Grand Total with all adjustments
    const calculateGrandTotal = () => {
        const values = form.getValues();
        const subtotal = calculateSubtotal();
        const discount = Number(values.discount) || 0;
        const crPayment = Number(values.crPayment) || 0;
        const shipmentCost = Number(values.shipmentCost) || 0;
        
        // Correct calculation: Subtotal - Discount - CR/Payment + Shipping
        return subtotal - discount - crPayment + shipmentCost;
    };

    if (showPreview && previewData) {
        return (
            <div className="space-y-4">
                <InvoicePreview invoice={previewData} /> 
            </div>
        );
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="invoiceNo">Invoice No.</Label>
                        <Input
                            id="invoiceNo"
                            readOnly
                            {...form.register("invoiceNo")}
                            value={invoiceNoLoading ? "Generating..." : form.watch("invoiceNo")}
                            className="bg-gray-100"
                        />
                        {form.formState.errors.invoiceNo && (
                            <p className="text-sm text-red-500">{form.formState.errors.invoiceNo.message}</p>
                        )}
                    </div>

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
                                     const currentInvoiceDate = form.getValues("date");
                                     if (currentInvoiceDate && !isNaN(terms) && terms > 0) {
                                        const newDueDate = new Date(currentInvoiceDate);
                                        newDueDate.setDate(currentInvoiceDate.getDate() + terms);
                                        form.setValue("dueDate", newDueDate);
                                     }
                                 }
                            })}
                        />
                        {form.formState.errors.paymentTerms && (
                            <p className="text-sm text-red-500">{form.formState.errors.paymentTerms.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emailEnabled">Email PDF</Label>
                        <div className="flex items-center space-x-2">
                            <Button
                                type="button"
                                variant={form.watch("emailEnabled") ? "default" : "outline"}
                                size="sm"
                                onClick={() => form.setValue("emailEnabled", !form.watch("emailEnabled"))}
                            >
                                {form.watch("emailEnabled") ? "ON" : "OFF"}
                            </Button>
                            <span className="text-sm text-gray-600">
                                {form.watch("emailEnabled") ? "PDF will be emailed to customer" : "PDF will not be emailed"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
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
                        <h3 className="text-lg font-medium">Diamond Items</h3>

                        {/* Diamond items section */}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="space-y-2">
                                        <Label htmlFor={`items.${index}.pricePerCarat`}>Price/ct (USD)</Label>
                                        <Input
                                            id={`items.${index}.pricePerCarat`}
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            {...form.register(`items.${index}.pricePerCarat`, { 
                                                valueAsNumber: true,
                                                setValueAs: v => Number(v) || 0.01
                                            })}
                                        />
                                        {form.formState.errors.items?.[index]?.pricePerCarat && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.items[index]?.pricePerCarat?.message}
                                            </p>
                                        )}
                                    </div>

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
                                    pricePerCarat: 0.01,
                                })
                            }
                        >
                            Add Item
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Financials and Description Card */} 
            <Card>
                 <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* RE-ADD Description Textarea */} 
                     <div className="space-y-2">
                         <Label htmlFor="description">Description (Optional)</Label>
                         <Textarea
                             id="description"
                             placeholder="Optional notes about the invoice"
                             {...form.register("description")}
                         />
                     </div>

                     {/* Financial Summary */} 
                     <div className="space-y-4">
                        {/* ... Financial inputs ... */} 
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
                        {/* Totals Display */} 
                        <div className="space-y-2 pt-4 border-t">
                            {/* ... totals ... */} 
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

            <div className="flex justify-end space-x-4 print:hidden">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                </Button>
                <Button type="submit" disabled={isSubmitting || invoiceNoLoading || shipmentsLoading}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (invoiceNoLoading || shipmentsLoading) ? (
                         <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                         </>
                    ) : (
                        "Generate Invoice"
                    )}
                </Button>
            </div>
        </form>
    );
}