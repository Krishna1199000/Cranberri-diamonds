import { NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();

    // Allow both admin and employees to fetch employee list
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If admin, return both employees and admins (since admins can also make sales)
    // If employee, return only employees
    const whereClause: Prisma.UserWhereInput =
      session.role === 'admin'
        ? { role: { in: ['employee', 'admin'] } }
        : { role: 'employee' };

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Deduplicate by ID to ensure no duplicates (in case of any data inconsistencies)
    const uniqueEmployees = Array.from(
      new Map(employees.map(emp => [emp.id, emp])).values()
    );

    return NextResponse.json({ success: true, employees: uniqueEmployees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}