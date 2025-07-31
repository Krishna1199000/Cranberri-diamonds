import { InvoiceForm } from "@/components/invoice/invoice-form";

export const dynamic = 'force-dynamic';

export default function NewInvoicePage() {
  return (
    <div className="container py-10 max-w-6xl">
      <InvoiceForm />
    </div>
  );
}