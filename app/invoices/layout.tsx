import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation';

interface InvoicesLayoutProps {
    children: React.ReactNode;
}

export default async function InvoicesLayout({ children }: InvoicesLayoutProps) {
    const session = await getSession();
    const userRole = session?.role as string;

    if (!session?.userId) {
      redirect('/auth/signin');
    }

    if (userRole === 'admin') {
        return (
            <AdminLayout>
                {children}
            </AdminLayout>
        );
    } else if (userRole === 'employee') {
         return (
            <EmployeeLayout>
                {children}
            </EmployeeLayout>
        );
    } else {
        console.error("Unauthorized role accessing invoices:", userRole);
        redirect('/auth/signin');
    }
} 