import { InvoiceForm } from "@/components/invoice/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="container py-10 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>
      <InvoiceForm />
    </div>
  );
}