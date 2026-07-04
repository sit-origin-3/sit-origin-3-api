import { prisma } from "../db.js"

type AuditAction = "LOGIN" | "LOGOUT" | "GIVE_POINTS" | "UPDATE_POINT" | "UPDATE_CONFIG"
type ActionStatus = "SUCCESS" | "FAILED"

export async function createAuditLog(options: {
  actorId: number
  action: AuditAction
  status?: ActionStatus
  targetId?: number
  metadata?: object
}) {
  await prisma.auditLog.create({
    data: {
      actorId: options.actorId,
      action: options.action,
      status: options.status ?? "SUCCESS",
      targetId: options.targetId ?? null,
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
  })
}
