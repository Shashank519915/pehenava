import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import FYClientPage from './ClientPage';

export default async function FinancialYearsPage() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  const years = await prisma.financialYear.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });

  return <FYClientPage initialYears={years} />;
}
