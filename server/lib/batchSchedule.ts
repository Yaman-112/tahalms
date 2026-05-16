import prisma from '../db';

// Overwrites `startDate` on the given modules with per-batch overrides from
// `batch_module_schedules`, when a row exists for the matching (batchCode,
// moduleId). Modules without an override keep their course-wide startDate.
export async function applyBatchSchedule<T extends { id: string; startDate?: Date | null }>(
  modules: T[],
  batchCode: string | null | undefined,
): Promise<T[]> {
  if (!batchCode || modules.length === 0) return modules;
  const overrides = await prisma.batchModuleSchedule.findMany({
    where: { batchCode, moduleId: { in: modules.map(m => m.id) } },
    select: { moduleId: true, startDate: true },
  });
  if (overrides.length === 0) return modules;
  const map = new Map(overrides.map(o => [o.moduleId, o.startDate]));
  return modules.map(m => map.has(m.id) ? { ...m, startDate: map.get(m.id)! } : m);
}

// Bulk version: returns a Map of moduleId -> overridden startDate for the
// given batchCode. Use when caller wants to merge overrides themselves.
export async function getBatchScheduleMap(batchCode: string, moduleIds: string[]): Promise<Map<string, Date>> {
  if (!batchCode || moduleIds.length === 0) return new Map();
  const overrides = await prisma.batchModuleSchedule.findMany({
    where: { batchCode, moduleId: { in: moduleIds } },
    select: { moduleId: true, startDate: true },
  });
  return new Map(overrides.map(o => [o.moduleId, o.startDate]));
}
