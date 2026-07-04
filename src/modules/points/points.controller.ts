import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
import { createAuditLog } from "../../lib/audit.js"
import type { GivePointsBody, AssignPointsBody } from "./points.schema.js"
export async function givePoints(
  req: FastifyRequest<{ Body: Static<typeof GivePointsBody> }>,
  reply: FastifyReply,
) {
  const { receiverCode, amount } = req.body
  const giverId = req.user.id

  const allowConfig = await prisma.systemConfig.findUnique({
    where: { key: "ALLOW_GIVE_POINT" },
  })
  if (allowConfig?.value === "false") {
    return reply.code(403).send({ error: "Giving points is currently disabled" })
  }

  // 1. หา giver (คนให้แต้ม) จาก id ใน JWT
  const giver = await prisma.appUser.findUnique({ where: { id: giverId } })
  if (!giver) return reply.code(404).send({ error: "Giver not found" })

  // 2. เช็คว่าแต้มของ giver พอมั้ย
  if (giver.points < amount)
    return reply.code(400).send({ error: "Not enough points" })

  // 3. หา receiver จาก userCode
  const receiver = await prisma.appUser.findUnique({
    where: { userCode: receiverCode },
  })
  if (!receiver) return reply.code(404).send({ error: "User not found" })

  // 4. เช็คว่า receiver เป็น FRESHY เท่านั้น
  if (receiver.role !== "FRESHY")
    return reply.code(400).send({ error: "Can only give points to FRESHY" })

  // 5. ทำ transaction (atomic - ถ้า step ไหน fail ทุกอย่าง rollback)
  await prisma.$transaction([
    // ลดแต้ม giver
    prisma.appUser.update({
      where: { id: giverId },
      data: { points: { decrement: amount } },
    }),
    // เพิ่มแต้ม receiver
    prisma.appUser.update({
      where: { id: receiver.id },
      data: { points: { increment: amount } },
    }),
    // บันทึก transaction history
    prisma.pointTransaction.create({
      data: { giverId, receiverId: receiver.id, amount },
    }),
  ])

  await createAuditLog({
    actorId: giverId,
    action: "GIVE_POINTS",
    targetId: receiver.id,
    metadata: { amount },
  })

  return reply.send({ success: true, receiverCode, amount })
}

export async function assignPoints(
  req: FastifyRequest<{ Body: Static<typeof AssignPointsBody> }>,
  reply: FastifyReply,
) {
  const { userCode, amount } = req.body

  const user = await prisma.appUser.findUnique({ where: { userCode } })
  if (!user) return reply.code(404).send({ error: "User not found" })

  const updated = await prisma.appUser.update({
    where: { userCode },
    data: { points: { increment: amount } },
  })

  await createAuditLog({
    actorId: req.user.id,
    action: "UPDATE_POINT",
    targetId: user.id,
    metadata: { amount },
  })

  return reply.send({ success: true, userCode, points: updated.points })
}
