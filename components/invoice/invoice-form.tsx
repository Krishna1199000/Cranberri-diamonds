"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn, calculateTotal, formatCurrency, generateInvoiceNumber } from "@/lib/utils";
import { format } from "date-fns";
import { InvoiceFormValues, invoiceFormSchema } from "@/lib/validators/invoice";
import { toast } from "sonner";
import { InvoicePreview } from "./invoice-preview";
import { SubmitHandler } from "react-hook-form";

export function InvoiceForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewData, setPreviewData] = useState<(InvoiceFormValues & { id?: string }) | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [lastInvoiceNo, setLastInvoiceNo] = useState<string | null>(null);
    const [invoiceNoLoading, setInvoiceNoLoading] = useState(true);

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

    const form = useForm<InvoiceFormValues, unknown, InvoiceFormValues>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues: {
            invoiceNo: "",
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            paymentTerms: 7,
            companyName: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            description: "",
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
                    pricePerCarat: 0.01,
                },
            ],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Generate and set invoice number when lastInvoiceNo is loaded and date changes
    useEffect(() => {
        const currentInvoiceDate = form.getValues("date");
        if (!invoiceNoLoading && currentInvoiceDate) {
            const newInvoiceNo = generateInvoiceNumber(lastInvoiceNo, currentInvoiceDate);
            form.setValue("invoiceNo", newInvoiceNo);
        }
    }, [lastInvoiceNo, invoiceNoLoading, form.watch("date"), form]);

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
                throw new Error(errorData.error || 'Failed to create invoice');
            }

            const result = await response.json();
            if (!result.invoice || !result.invoice.id) { 
                throw new Error("API response did not include the created invoice ID.");
            }
            
            toast.success("Invoice created successfully: " + result.invoice.invoiceNo);
            setLastInvoiceNo(result.invoice.invoiceNo);
            setPreviewData({ 
                ...submissionData, 
                id: result.invoice.id
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
                <CardContent className="pt-6">
                    {/* Invoice header information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNo">Invoice No.</Label>
                                <Input
                                    id="invoiceNo"
                                    readOnly
                                    {...form.register("invoiceNo")}
                                    value={invoiceNoLoading ? "Generating..." : form.watch("invoiceNo")}
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        {/* Company and Address information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    {...form.register("companyName")}
                                />
                                {form.formState.errors.companyName && (
                                    <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="addressLine1">Address Line 1</Label>
                                <Input
                                    id="addressLine1"
                                    {...form.register("addressLine1")}
                                />
                                {form.formState.errors.addressLine1 && (
                                    <p className="text-sm text-red-500">{form.formState.errors.addressLine1.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                                <Input
                                    id="addressLine2"
                                    {...form.register("addressLine2")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    {...form.register("city")}
                                />
                                {form.formState.errors.city && (
                                    <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    {...form.register("state")}
                                />
                                {form.formState.errors.state && (
                                    <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    {...form.register("country")}
                                />
                                {form.formState.errors.country && (
                                    <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    {...form.register("postalCode")}
                                />
                                {form.formState.errors.postalCode && (
                                    <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                {...form.register("description")}
                                placeholder="Optional notes or description..."
                            />
                        </div>
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

            {/* Totals Section */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {/* Subtotal (calculated) */}
                        <div className="text-right font-medium">Subtotal:</div>
                        <div className="text-right">{formatCurrency(calculateSubtotal())}</div>

                        {/* Discount Input */}
                        <Label htmlFor="discount" className="text-right self-center">Discount:</Label>
                        <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            min="0"
                            className="text-right"
                            {...form.register("discount", {
                                valueAsNumber: true,
                                setValueAs: v => Number(v) || 0
                            })}
                            placeholder="0.00"
                        />
                        {form.formState.errors.discount && (
                            <p className="col-span-2 text-right text-sm text-red-500">{form.formState.errors.discount.message}</p>
                        )}

                        {/* CR/Payment Input */}
                        <Label htmlFor="crPayment" className="text-right self-center">CR/Payment:</Label>
                        <Input
                            id="crPayment"
                            type="number"
                            step="0.01"
                            min="0"
                            className="text-right"
                            {...form.register("crPayment", {
                                valueAsNumber: true,
                                setValueAs: v => Number(v) || 0
                            })}
                            placeholder="0.00"
                        />
                        {form.formState.errors.crPayment && (
                            <p className="col-span-2 text-right text-sm text-red-500">{form.formState.errors.crPayment.message}</p>
                        )}

                        {/* Shipping Input */}
                        <Label htmlFor="shipmentCost" className="text-right self-center">Shipping:</Label>
                        <Input
                            id="shipmentCost"
                            type="number"
                            step="0.01"
                            min="0"
                            className="text-right"
                            {...form.register("shipmentCost", {
                                valueAsNumber: true,
                                setValueAs: v => Number(v) || 0
                            })}
                            placeholder="0.00"
                        />
                        {form.formState.errors.shipmentCost && (
                            <p className="col-span-2 text-right text-sm text-red-500">{form.formState.errors.shipmentCost.message}</p>
                        )}

                        {/* Separator */}
                        <div className="col-span-2 border-t my-2"></div>

                        {/* Total Due (Grand Total) */}
                        <div className="text-right font-bold text-lg">Total Due:</div>
                        <div className="text-right font-bold text-lg">{formatCurrency(calculateGrandTotal())}</div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 print:hidden">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                </Button>
                <Button type="submit" disabled={isSubmitting || invoiceNoLoading}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : invoiceNoLoading ? (
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