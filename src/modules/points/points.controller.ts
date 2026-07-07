import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
import { createAuditLog } from "../../lib/audit.js"
import type { GiveBulkPointsBody, AssignPointsBody } from "./points.schema.js"
export async function giveBulkPoints(
  req: FastifyRequest<{ Body: Static<typeof GiveBulkPointsBody> }>,
  reply: FastifyReply,
) {
  const { receiverCodes, amount } = req.body
  const giverId = req.user.id

  const [allowConfig, limitConfig] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: "ALLOW_GIVE_POINT" } }),
    prisma.systemConfig.findUnique({ where: { key: "MAX_POINTS_PER_FRESHY" } }),
  ])

  if (allowConfig?.value === "false") {
    return reply.code(403).send({ error: "Giving points is currently disabled" })
  }

  const giver = await prisma.appUser.findUnique({
    where: { id: giverId },
    include: { group: true },
  })
  if (!giver) return reply.code(404).send({ error: "Giver not found" })

  const station = giver.group

  // หา receivers ทั้งหมดพร้อมกัน
  const receivers = await prisma.appUser.findMany({
    where: { userCode: { in: receiverCodes }, role: "FRESHY" },
  })

  // เช็คว่า code ทุกตัวเจอและเป็น FRESHY
  const foundCodes = new Set(receivers.map((r) => r.userCode))
  const invalidCodes = receiverCodes.filter((c) => !foundCodes.has(c))
  if (invalidCodes.length > 0) {
    return reply.code(400).send({ error: `Invalid or non-FRESHY codes: ${invalidCodes.join(", ")}` })
  }

  // แยกคนที่ติด limit ออก
  let eligibleReceivers = receivers
  let exceededCodes: string[] = []

  if (limitConfig?.value) {
    const maxLimit = Number(limitConfig.value)
    const totals = await prisma.pointTransaction.groupBy({
      by: ["receiverId"],
      where: { stationId: station.id, receiverId: { in: receivers.map((r) => r.id) } },
      _sum: { amount: true },
    })
    const givenMap = new Map(totals.map((t) => [t.receiverId, t._sum.amount ?? 0]))

    eligibleReceivers = receivers.filter((r) => (givenMap.get(r.id) ?? 0) + amount <= maxLimit)
    exceededCodes = receivers
      .filter((r) => (givenMap.get(r.id) ?? 0) + amount > maxLimit)
      .map((r) => r.userCode)
  }

  // ถ้าไม่มีใครรับได้เลย
  if (eligibleReceivers.length === 0) {
    return reply.code(400).send({
      error: "All receivers have exceeded the limit",
      exceededCodes,
    })
  }

  const totalCost = amount * eligibleReceivers.length

  if (station.points < totalCost) {
    return reply.code(400).send({
      error: `Not enough station pool points (need ${totalCost}, have ${station.points})`,
    })
  }

  // Atomic transaction — หักจาก pool ครั้งเดียว เพิ่มแต้มเฉพาะคนที่ eligible
  await prisma.$transaction([
    prisma.userGroup.update({
      where: { id: station.id },
      data: { points: { decrement: totalCost } },
    }),
    ...eligibleReceivers.map((r) =>
      prisma.appUser.update({
        where: { id: r.id },
        data: { points: { increment: amount } },
      }),
    ),
    ...eligibleReceivers.map((r) =>
      prisma.pointTransaction.create({
        data: { giverId, stationId: station.id, receiverId: r.id, amount },
      }),
    ),
  ])

  await Promise.all(
    eligibleReceivers.map((r) =>
      createAuditLog({
        actorId: giverId,
        action: "GIVE_POINTS",
        targetId: r.id,
        metadata: { amount },
      }),
    ),
  )

  return reply.send({
    success: true,
    amount,
    receivers: eligibleReceivers.map((r) => r.userCode),
    exceededCodes,
  })
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
