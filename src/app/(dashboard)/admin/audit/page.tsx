import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import AuditClientPage from './ClientPage';
import { getAuditLogs } from '@/server/auditActions';

interface AuditPageProps {
  searchParams: Promise<{
    page?: string;
    eventType?: string;
    actorEmail?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const eventType = params.eventType || undefined;
  const actorEmail = params.actorEmail || undefined;
  const entityType = params.entityType || undefined;
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;

  const result = await getAuditLogs({ 
    page, 
    limit: 50, 
    eventType,
    actorEmail,
    entityType,
    dateFrom,
    dateTo,
  });

  return (
    <AuditClientPage 
      initialData={result} 
      currentPage={page} 
      currentFilters={{
        eventType: eventType || '',
        actorEmail: actorEmail || '',
        entityType: entityType || '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || '',
      }} 
    />
  );
}
