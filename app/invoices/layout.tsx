import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import React from "react";

interface InvoicesLayoutProps {
    children: React.ReactNode;
}

export default function InvoicesLayout({ children }: InvoicesLayoutProps) {
    return (
        <EmployeeLayout>
            {children}
        </EmployeeLayout>
    );
} 