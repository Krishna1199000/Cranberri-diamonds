import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function EmployeeAnalyticsPage() {
  const session = await getSession();

  if (session?.role === 'admin') {
    redirect('/Admins/analytics');
  }

  redirect('/employee/sales');
}
