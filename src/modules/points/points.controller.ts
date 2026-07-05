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

  const [allowConfig, limitConfig] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: "ALLOW_GIVE_POINT" } }),
    prisma.systemConfig.findUnique({ where: { key: "MAX_POINTS_PER_FRESHY" } }),
  ])

  if (allowConfig?.value === "false") {
    return reply.code(403).send({ error: "Giving points is currently disabled" })
  }

  // 1. หา giver พร้อม group (station pool)
  const giver = await prisma.appUser.findUnique({
    where: { id: giverId },
    include: { group: true },
  })
  if (!giver) return reply.code(404).send({ error: "Giver not found" })

  const station = giver.group
  // 2. เช็คว่า pool ของ station พอมั้ย
  if (station.points < amount)
    return reply.code(400).send({ error: "Not enough station pool points" })

  // 3. หา receiver จาก userCode
  const receiver = await prisma.appUser.findUnique({
    where: { userCode: receiverCode },
  })
  if (!receiver) return reply.code(404).send({ error: "User not found" })

  // 4. เช็คว่า receiver เป็น FRESHY เท่านั้น
  if (receiver.role !== "FRESHY")
    return reply.code(400).send({ error: "Can only give points to FRESHY" })

  // 4.5 เช็ค limit ต่อ freshy ต่อ station
  if (limitConfig?.value) {
    const maxLimit = Number(limitConfig.value)
    const totalGiven = await prisma.pointTransaction.aggregate({
      where: { stationId: station.id, receiverId: receiver.id },
      _sum: { amount: true },
    })
    const alreadyGiven = totalGiven._sum.amount ?? 0
    if (alreadyGiven + amount > maxLimit) {
      return reply.code(400).send({
        error: `Exceeded limit — already given ${alreadyGiven}/${maxLimit} points to this freshy from this station`,
      })
    }
  }

  // 5. ทำ transaction (atomic)
  await prisma.$transaction([
    // ลดแต้ม pool ของ station
    prisma.userGroup.update({
      where: { id: station.id },
      data: { points: { decrement: amount } },
    }),
    // เพิ่มแต้ม receiver
    prisma.appUser.update({
      where: { id: receiver.id },
      data: { points: { increment: amount } },
    }),
    // บันทึก transaction history พร้อม stationId
    prisma.pointTransaction.create({
      data: { giverId, stationId: station.id, receiverId: receiver.id, amount },
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

  const user = await prisma.appUser.findUnique({
    where: { userCode },
    include: { group: true },
  })
  if (!user) return reply.code(404).send({ error: "User not found" })

  if (user.role === "STAFF" || user.role === "ADMIN") {
    // กำหนด pool ของฐานที่ user คนนี้อยู่
    const updated = await prisma.userGroup.update({
      where: { id: user.groupId },
      data: { points: amount },
    })

    await createAuditLog({
      actorId: req.user.id,
      action: "UPDATE_POINT",
      targetId: user.id,
      metadata: { amount, target: "station_pool", stationId: user.groupId },
    })

    return reply.send({ success: true, userCode, stationId: user.groupId, stationPoints: updated.points })
  }

  // FRESHY — กำหนด points ส่วนตัวเหมือนเดิม
  const updated = await prisma.appUser.update({
    where: { userCode },
    data: { points: amount },
  })

  await createAuditLog({
    actorId: req.user.id,
    action: "UPDATE_POINT",
    targetId: user.id,
    metadata: { amount },
  })

  return reply.send({ success: true, userCode, points: updated.points })
}
