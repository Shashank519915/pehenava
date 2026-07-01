'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * Validates that the current session belongs to an ADMIN.
 */
async function requireAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    throw new Error('Unauthorized. Only administrators can view audit logs.');
  }
  return session.user;
}

/**
 * Retrieves paginated audit logs.
 */
export async function getAuditLogs(payload: {
  page?: number;
  limit?: number;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  await requireAdmin();

  const page = payload.page || 1;
  const limit = payload.limit || 50;
  const skip = (page - 1) * limit;

  // Build dynamic where clause
  const where: any = {};
  if (payload.eventType) where.eventType = payload.eventType;
  if (payload.entityType) where.entityType = payload.entityType;
  if (payload.entityId) where.entityId = payload.entityId;
  if (payload.actorId) where.actorId = payload.actorId;
  if (payload.actorEmail) {
    where.actor = {
      email: { contains: payload.actorEmail, mode: 'insensitive' }
    };
  }
  if (payload.dateFrom || payload.dateTo) {
    where.timestamp = {};
    if (payload.dateFrom) where.timestamp.gte = new Date(payload.dateFrom);
    if (payload.dateTo) where.timestamp.lte = new Date(payload.dateTo);
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
      include: {
        actor: {
          select: { name: true, email: true, role: true }
        }
      }
    })
  ]);

  return {
    data: logs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
