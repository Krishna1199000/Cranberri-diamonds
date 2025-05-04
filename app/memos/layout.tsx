import React from 'react';
import { getSession } from '@/lib/session';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { redirect } from 'next/navigation';

interface MemosLayoutProps {
    children: React.ReactNode;
}

// This layout ensures that memo-related pages are wrapped by the correct role-specific layout.
export default async function MemosLayout({ children }: MemosLayoutProps) {
    const session = await getSession();

    // If no session or user ID, redirect to sign-in
    if (!session || !session.userId) {
        redirect('/auth/signin?callbackUrl=/memos');
    }

    const userRole = session.role;

    // Render Admin layout if user is admin
    if (userRole === 'admin') {
        return <AdminLayout>{children}</AdminLayout>;
    }

    // Render Employee layout if user is employee
    if (userRole === 'employee') {
        return <EmployeeLayout>{children}</EmployeeLayout>;
    }

    // If user is neither admin nor employee (e.g., customer or other roles), 
    // redirect them or show an access denied message. Redirecting to base dashboard for now.
    // Consider a more specific access denied page.
    redirect('/'); 

    // Fallback/Loading state (should ideally not be reached due to redirects)
    // return <CranberriLoader />;
} 