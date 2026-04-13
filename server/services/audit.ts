import prisma from '../db';
import { AuditAction } from '../../src/generated/prisma';

export async function createAuditLog(params: {
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues?: any;
  newValues?: any;
  changedById: string;
  reason?: string;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      tableName: params.tableName,
      recordId: params.recordId,
      action: params.action,
      oldValues: params.oldValues ?? undefined,
      newValues: params.newValues ?? undefined,
      changedById: params.changedById,
      reason: params.reason,
      ipAddress: params.ipAddress,
    },
  });
}
