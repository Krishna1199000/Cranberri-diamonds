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

export function InvoiceForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewData, setPreviewData] = useState<InvoiceFormValues | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [lastInvoiceId, setLastInvoiceId] = useState(0);

    useEffect(() => {
        // Fetch the latest invoice ID for generating the next invoice number
        fetch("/api/invoices/latest")
            .then((res) => res.json())
            .then((data) => {
                if (data.lastId) {
                    setLastInvoiceId(data.lastId);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch latest invoice ID:", error);
            });
    }, []);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues: {
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            paymentTerms: 30,
            items: [
                {
                    description: "",
                    carat: 0,
                    color: "",
                    clarity: "",
                    lab: "",
                    reportNo: "",
                    pricePerCarat: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useEffect(() => {
        if (lastInvoiceId > 0) {
            const invoiceNo = generateInvoiceNumber(lastInvoiceId);
            form.setValue("invoiceNo", invoiceNo);
        }
    }, [lastInvoiceId, form]);

    // Update this part of your InvoiceForm component

    // Updated onSubmit function in your InvoiceForm component
    const onSubmit = async (data: InvoiceFormValues) => {
        try {
            setIsSubmitting(true);

            // Make sure the invoiceNo is included in the submitted data
            if (!data.invoiceNo) {
                data.invoiceNo = generateInvoiceNumber(lastInvoiceId);
            }

            // Ensure all the required fields are present
            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create invoice');
            }

            const result = await response.json();
            toast.success("Invoice created successfully");

            // Set the data for preview
            setPreviewData(data);
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

    const calculateGrandTotal = () => {
        const values = form.getValues();
        return values.items.reduce((total, item) => {
            return total + calculateItemTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
        }, 0);
    };

    if (showPreview && previewData) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                        Back to Edit
                    </Button>
                    <Button onClick={() => window.print()}>Print Invoice</Button>
                </div>
                <InvoicePreview invoice={previewData} />
            </div>
        );
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNo">Invoice No.</Label>
                                <Input
                                    id="invoiceNo"
                                    readOnly
                                    {...form.register("invoiceNo")}
                                    defaultValue={lastInvoiceId > 0 ? generateInvoiceNumber(lastInvoiceId) : "Generating..."}
                                />
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
                                                    onSelect={field.onChange}
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
                                                    onSelect={field.onChange}
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

                        <div className="space-y-2">
                            <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                            <Input
                                id="paymentTerms"
                                type="number"
                                {...form.register("paymentTerms", { valueAsNumber: true })}
                            />
                            {form.formState.errors.paymentTerms && (
                                <p className="text-sm text-red-500">{form.formState.errors.paymentTerms.message}</p>
                            )}
                        </div>

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
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Diamond Items</h3>

                        {fields.map((field, index) => (
                            <div key={field.id} className="border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Item #{index + 1}</h4>
                                    <Button
                                        type="button"
                                        variant="ghost"
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
                                            {...form.register(`items.${index}.carat`, { valueAsNumber: true })}
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
                                            {...form.register(`items.${index}.pricePerCarat`, { valueAsNumber: true })}
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
                                    carat: 0,
                                    color: "",
                                    clarity: "",
                                    lab: "",
                                    reportNo: "",
                                    pricePerCarat: 0,
                                })
                            }
                        >
                            Add Item
                        </Button>

                        <div className="border-t pt-4 flex justify-between items-center">
                            <h4 className="font-medium">Grand Total</h4>
                            <div className="text-xl font-bold">
                                {formatCurrency(calculateGrandTotal())}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (
                        "Generate Invoice"
                    )}
                </Button>
            </div>
        </form>
    );
}