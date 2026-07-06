import type { FastifyRequest, FastifyReply } from "fastify"
import { prisma } from "../../db.js"

const actorSelect = {
  id: true,
  firstname: true,
  lastname: true,
  nickname: true,
  userCode: true,
  role: true,
} as const

export async function getAuditLogs(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as { page?: string; limit?: string; action?: string }
  const page = Math.max(1, parseInt(query.page ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "50")))
  const skip = (page - 1) * limit

  const where = query.action ? { action: query.action as never } : {}

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        status: true,
        metadata: true,
        createdAt: true,
        actor: { select: actorSelect },
        target: { select: actorSelect },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return reply.send({ logs, total, page, limit })
}
