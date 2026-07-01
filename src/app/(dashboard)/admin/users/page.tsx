import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import UsersClientPage from './ClientPage';

export default async function UsersPage() {
  const session = await auth();
  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MAINTAINER)) {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      _count: {
        select: { sessions: true }
      }
    }
  });

  return <UsersClientPage initialUsers={users} currentUserRole={session.user.role} />;
}
