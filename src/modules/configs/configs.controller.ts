import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
import { createAuditLog } from "../../lib/audit.js"
import type { UpdateConfigParams, UpdateConfigBody } from "./configs.schema.js"

// GET /api/configs
export async function getConfigs(_req: FastifyRequest, reply: FastifyReply) {
  const configs = await prisma.systemConfig.findMany()
  return reply.send(configs)
}

// PATCH /api/configs/:key
export async function updateConfig(
  req: FastifyRequest<{
    Params: Static<typeof UpdateConfigParams>
    Body: Static<typeof UpdateConfigBody>
  }>,
  reply: FastifyReply,
) {
  const { key } = req.params
  const { value } = req.body

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  await createAuditLog({
    actorId: req.user.id,
    action: "UPDATE_CONFIG",
    metadata: { key, value },
  })

  return reply.send(config)
}
