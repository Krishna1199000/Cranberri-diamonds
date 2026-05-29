"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trash2, ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { cn, formatCurrency, generateInvoiceNumber } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

// Lot B Invoice schema - similar to regular invoice but with more detailed stone fields
const lotBStoneSchema = z.object({
  reportNo: z.string().min(1, "Report Number is required"),
  shape: z.string().min(1, "Shape is required"),
  carat: z.number().min(0.01, "Carat must be at least 0.01"),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  cut: z.string().optional(),
  polish: z.string().optional(),
  symmetry: z.string().optional(),
  fluorescence: z.string().optional(),
  lab: z.string().min(1, "Lab is required"),
  price: z.number().min(0.01, "Price must be at least 0.01"),
});

const lotBInvoiceSchema = z.object({
  invoiceNo: z.string().min(1, "Invoice number is required"),
  date: z.date(),
  dueDate: z.date(),
  paymentTerms: z.number().min(1, "Payment terms must be at least 1 day"),
  companyName: z.string().min(1, "Company name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  description: z.string().optional(),
  shipmentCost: z.number().min(0, "Shipment cost must be positive"),
  discount: z.number().min(0, "Discount must be positive"),
  crPayment: z.number().min(0, "CR Payment must be positive"),
  emailEnabled: z.boolean(),
  items: z.array(lotBStoneSchema).min(1, "At least one item is required"),
});

type LotBInvoiceFormValues = z.infer<typeof lotBInvoiceSchema>;

interface SessionUser {
  id: string;
  role: 'admin' | 'employee' | 'customer';
  name?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export default function LotBInvoicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInvoiceNo, setLastInvoiceNo] = useState<string | null>(null);
  const [invoiceNoLoading, setInvoiceNoLoading] = useState(true);
  const [userRole, setUserRole] = useState<SessionUser['role'] | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [reportNoErrors, setReportNoErrors] = useState<{ [key: number]: string }>({});
  const [reportNoChecking, setReportNoChecking] = useState<{ [key: number]: boolean }>({});

  const defaultValues: LotBInvoiceFormValues = {
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
    emailEnabled: true,
    items: [
      {
        reportNo: "",
        shape: "",
        carat: 0.01,
        color: "",
        clarity: "",
        cut: "",
        polish: "",
        symmetry: "",
        fluorescence: "",
        lab: "",
        price: 0.01,
      },
    ],
  };

  const form = useForm<LotBInvoiceFormValues>({
    resolver: zodResolver(lotBInvoiceSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Check user role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: 'include' });
        if (response.ok) {
          const userData: SessionUser = await response.json();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("Failed to verify user role.");
      }
    };
    fetchUser();
  }, []);

  // Fetch invoice number
  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      setInvoiceNoLoading(true);
      try {
        const response = await fetch("/api/invoices/latest-number");
        const data = await response.json();
        if (data.lastInvoiceNo) {
          setLastInvoiceNo(data.lastInvoiceNo);
        }
      } catch (error) {
        console.error("Failed to fetch latest invoice number:", error);
      } finally {
        setInvoiceNoLoading(false);
      }
    };
    fetchInvoiceNumber();
  }, []);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const response = await fetch("/api/companies/search");
        const data = await response.json();
        if (data.success && Array.isArray(data.companies)) {
          setCompanies(data.companies);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast.error("Failed to load companies");
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleGenerateInvoiceNumber = () => {
    const newNumber = generateInvoiceNumber(lastInvoiceNo, form.getValues("date"));
    form.setValue("invoiceNo", newNumber);
    toast.success("Invoice number generated");
  };

  const handleCompanySelect = (company: CompanyOption) => {
    setSelectedShipmentId(company.id);
    form.setValue("companyName", company.name);
    form.setValue("addressLine1", company.addressLine1 || "");
    form.setValue("addressLine2", company.addressLine2 || "");
    form.setValue("city", company.city || "");
    form.setValue("state", company.state || "");
    form.setValue("country", company.country || "");
    form.setValue("postalCode", company.postalCode || "");
  };

  const calculateItemTotal = (carat: number, price: number) => {
    return carat * price;
  };

  const calculateSubtotal = () => {
    const items = form.getValues("items");
    return items.reduce((sum, item) => sum + calculateItemTotal(item.carat || 0, item.price || 0), 0);
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const shipmentCost = form.getValues("shipmentCost") || 0;
    const discount = form.getValues("discount") || 0;
    const crPayment = form.getValues("crPayment") || 0;
    return subtotal + shipmentCost - discount - crPayment;
  };

  const checkReportNumberDuplicate = async (reportNo: string, itemIndex: number) => {
    if (!reportNo || reportNo.trim().length === 0) {
      setReportNoErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[itemIndex];
        return newErrors;
      });
      return;
    }

    setReportNoChecking(prev => ({ ...prev, [itemIndex]: true }));

    try {
      const response = await fetch("/api/inventory-items/check-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportNo: reportNo.trim() }),
      });

      const result = await response.json();

      if (result.success && result.exists) {
        setReportNoErrors(prev => ({
          ...prev,
          [itemIndex]: result.message
        }));
        form.setValue(`items.${itemIndex}.reportNo`, "");
        toast.error(result.message);
      } else {
        setReportNoErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[itemIndex];
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error checking report number:", error);
      toast.error("Failed to validate report number");
    } finally {
      setReportNoChecking(prev => ({ ...prev, [itemIndex]: false }));
    }
  };

  const onSubmit = async (data: LotBInvoiceFormValues) => {
    // Check for any existing report number errors
    const hasReportNoErrors = Object.keys(reportNoErrors).length > 0;
    if (hasReportNoErrors) {
      toast.error("Please resolve report number conflicts before submitting");
      return;
    }

    // Check if any report numbers are currently being validated
    const isCheckingReportNos = Object.values(reportNoChecking).some(checking => checking);
    if (isCheckingReportNos) {
      toast.error("Please wait for report number validation to complete");
      return;
    }

    if (!selectedShipmentId) {
      toast.error("Please select a company from the list.");
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData = {
        date: data.date,
        dueDate: data.dueDate,
        paymentTerms: data.paymentTerms,
        shipmentId: selectedShipmentId,
        description: data.description,
        shipmentCost: data.shipmentCost,
        discount: data.discount,
        crPayment: data.crPayment,
        emailEnabled: data.emailEnabled,
        items: data.items.map(item => ({
          description: `${item.shape} ${item.carat}ct ${item.color} ${item.clarity}${item.cut ? ` ${item.cut}` : ''}${item.polish ? ` ${item.polish}` : ''}${item.symmetry ? ` ${item.symmetry}` : ''}${item.fluorescence ? ` ${item.fluorescence}` : ''} ${item.lab}`,
          carat: item.carat,
          color: item.color,
          clarity: item.clarity,
          lab: item.lab,
          shape: item.shape,
          reportNo: item.reportNo,
          pricePerCarat: item.price,
          stockId: `LOT-B-${item.reportNo}`, // Mark as Lot B item
        })),
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create Lot B invoice");
      }

      toast.success("Lot B Invoice created successfully!");
      form.reset();
      setSelectedShipmentId("");
      
      // Redirect to invoices list or show success
      window.location.href = "/invoices";
    } catch (error) {
      console.error("Error creating Lot B invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create Lot B invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBackHref = () => {
    if (userRole === 'admin') return '/invoices';
    if (userRole === 'employee') return '/invoices';
    return '/';
  };

  if (!userRole || (userRole !== 'admin' && userRole !== 'employee')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to create Lot B invoices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href={getBackHref()}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Create Lot B Invoice</h1>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice Number</Label>
              <div className="flex gap-2">
                <Input
                  id="invoiceNo"
                  {...form.register("invoiceNo")}
                  placeholder="Enter invoice number"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateInvoiceNumber}
                  disabled={invoiceNoLoading}
                >
                  {invoiceNoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
              {form.formState.errors.invoiceNo && (
                <p className="text-sm text-red-500">{form.formState.errors.invoiceNo.message}</p>
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
                  setValueAs: v => Number(v) || 7
                })}
              />
              {form.formState.errors.paymentTerms && (
                <p className="text-sm text-red-500">{form.formState.errors.paymentTerms.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("date") ? format(form.watch("date"), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("date")}
                    onSelect={(date) => form.setValue("date", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.date && (
                <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("dueDate") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("dueDate") ? format(form.watch("dueDate"), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("dueDate")}
                    onSelect={(date) => form.setValue("dueDate", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Company / Party Name *</Label>
              <Select
                value={selectedShipmentId}
                onValueChange={(value) => {
                  const company = companies.find(c => c.id === value);
                  if (company) handleCompanySelect(company);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!selectedShipmentId && (
                <p className="text-xs text-muted-foreground">Select a company before creating the Lot B invoice.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  placeholder="Enter company name"
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
                  placeholder="Enter address"
                />
                {form.formState.errors.addressLine1 && (
                  <p className="text-sm text-red-500">{form.formState.errors.addressLine1.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  {...form.register("addressLine2")}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  placeholder="Enter city"
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
                  placeholder="Enter state"
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
                  placeholder="Enter country"
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
                  placeholder="Enter postal code"
                />
                {form.formState.errors.postalCode && (
                  <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stone Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Stone Details (Off-Inventory)</CardTitle>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Lot B is for stones NOT in inventory</p>
                  <p>If a stone is already in inventory, use the regular "Add to Cart" method instead. The system will automatically check for duplicates when you enter a report number.</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Stone #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (fields.length > 1) {
                        remove(index);
                        // Clear any error for this index and adjust for removed item
                        setReportNoErrors(prev => {
                          const newErrors: { [key: number]: string } = {};
                          Object.keys(prev).forEach(key => {
                            const keyIndex = parseInt(key);
                            if (keyIndex < index) {
                              newErrors[keyIndex] = prev[keyIndex];
                            } else if (keyIndex > index) {
                              newErrors[keyIndex - 1] = prev[keyIndex];
                            }
                            // Skip the removed index
                          });
                          return newErrors;
                        });
                        setReportNoChecking(prev => {
                          const newChecking: { [key: number]: boolean } = {};
                          Object.keys(prev).forEach(key => {
                            const keyIndex = parseInt(key);
                            if (keyIndex < index) {
                              newChecking[keyIndex] = prev[keyIndex];
                            } else if (keyIndex > index) {
                              newChecking[keyIndex - 1] = prev[keyIndex];
                            }
                            // Skip the removed index
                          });
                          return newChecking;
                        });
                      } else {
                        toast.error("You must have at least one stone");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.reportNo`}>Report Number *</Label>
                    <div className="relative">
                      <Input
                        id={`items.${index}.reportNo`}
                        {...form.register(`items.${index}.reportNo`)}
                        placeholder="Certificate number"
                        onBlur={(e) => checkReportNumberDuplicate(e.target.value, index)}
                        className={reportNoErrors[index] ? "border-red-500" : ""}
                      />
                      {reportNoChecking[index] && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {form.formState.errors.items?.[index]?.reportNo && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.reportNo?.message}
                      </p>
                    )}
                    {reportNoErrors[index] && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">
                          {reportNoErrors[index]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.shape`}>Shape *</Label>
                    <Input
                      id={`items.${index}.shape`}
                      {...form.register(`items.${index}.shape`)}
                      placeholder="e.g., Round, Oval, etc."
                    />
                    {form.formState.errors.items?.[index]?.shape && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.shape?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.carat`}>Carat Weight *</Label>
                    <Input
                      id={`items.${index}.carat`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...form.register(`items.${index}.carat`, { 
                        valueAsNumber: true,
                        setValueAs: v => Number(v) || 0.01
                      })}
                      placeholder="0.00"
                    />
                    {form.formState.errors.items?.[index]?.carat && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.carat?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.color`}>Color *</Label>
                    <Input
                      id={`items.${index}.color`}
                      {...form.register(`items.${index}.color`)}
                      placeholder="e.g., D, E, F, etc."
                    />
                    {form.formState.errors.items?.[index]?.color && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.color?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.clarity`}>Clarity *</Label>
                    <Input
                      id={`items.${index}.clarity`}
                      {...form.register(`items.${index}.clarity`)}
                      placeholder="e.g., FL, IF, VVS1, etc."
                    />
                    {form.formState.errors.items?.[index]?.clarity && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.clarity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.cut`}>Cut</Label>
                    <Input
                      id={`items.${index}.cut`}
                      {...form.register(`items.${index}.cut`)}
                      placeholder="e.g., Excellent, Good, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.polish`}>Polish</Label>
                    <Input
                      id={`items.${index}.polish`}
                      {...form.register(`items.${index}.polish`)}
                      placeholder="e.g., Excellent, Good, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.symmetry`}>Symmetry</Label>
                    <Input
                      id={`items.${index}.symmetry`}
                      {...form.register(`items.${index}.symmetry`)}
                      placeholder="e.g., Excellent, Good, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.fluorescence`}>Fluorescence</Label>
                    <Input
                      id={`items.${index}.fluorescence`}
                      {...form.register(`items.${index}.fluorescence`)}
                      placeholder="e.g., None, Faint, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.lab`}>Lab *</Label>
                    <Select 
                      value={form.watch(`items.${index}.lab`) || ""}
                      onValueChange={(value) => form.setValue(`items.${index}.lab`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lab" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GIA">GIA</SelectItem>
                        <SelectItem value="IGI">IGI</SelectItem>
                        <SelectItem value="Non-Cert">Non-Cert</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.items?.[index]?.lab && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.lab?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.price`}>Price (USD) *</Label>
                    <Input
                      id={`items.${index}.price`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...form.register(`items.${index}.price`, { 
                        valueAsNumber: true,
                        setValueAs: v => Number(v) || 0.01
                      })}
                      placeholder="0.00"
                    />
                    {form.formState.errors.items?.[index]?.price && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.price?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="h-10 px-3 py-2 border rounded-md flex items-center bg-muted">
                      {formatCurrency(
                        calculateItemTotal(
                          Number(form.watch(`items.${index}.carat`)) || 0,
                          Number(form.watch(`items.${index}.price`)) || 0
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
                  reportNo: "",
                  shape: "",
                  carat: 0.01,
                  color: "",
                  clarity: "",
                  cut: "",
                  polish: "",
                  symmetry: "",
                  fluorescence: "",
                  lab: "",
                  price: 0.01,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stone
            </Button>
          </CardContent>
        </Card>

        {/* Financial Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Optional notes about the invoice"
                  {...form.register("description")}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailEnabled"
                  checked={form.watch("emailEnabled")}
                  onCheckedChange={(checked) => form.setValue("emailEnabled", checked)}
                />
                <Label htmlFor="emailEnabled">Send email notification</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipmentCost">Shipment Cost</Label>
                  <Input
                    id="shipmentCost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("shipmentCost", { 
                      valueAsNumber: true,
                      setValueAs: v => Number(v) || 0
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("discount", { 
                      valueAsNumber: true,
                      setValueAs: v => Number(v) || 0
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crPayment">CR/Payment</Label>
                <Input
                  id="crPayment"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("crPayment", { 
                    valueAsNumber: true,
                    setValueAs: v => Number(v) || 0
                  })}
                  placeholder="0.00"
                />
              </div>

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

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={
              isSubmitting || 
              Object.keys(reportNoErrors).length > 0 || 
              Object.values(reportNoChecking).some(checking => checking)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Lot B Invoice"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}