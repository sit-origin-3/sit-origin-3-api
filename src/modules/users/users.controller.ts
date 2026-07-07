import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
import { getRankById } from "../../lib/leaderboard.js"
import type { GetUserByCodeParams } from "./users.schema.js"

const userSelect = {
  id: true,
  email: true,
  firstname: true,
  lastname: true,
  nickname: true,
  userCode: true,
  role: true,
  major: true,
  session: true,
  points: true,
  group: { select: { id: true, name: true, nameAlt: true, points: true } },
} as const

// GET /users
export async function getAllUsers(_req: FastifyRequest, reply: FastifyReply) {
  const users = await prisma.appUser.findMany({
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      nickname: true,
      userCode: true,
      role: true,
      major: true,
      session: true,
      points: true,
      group: { select: { id: true, name: true, nameAlt: true, points: true } },
    },
    orderBy: { id: "asc" },
  })

  return reply.send(
    users.map((u) => ({
      ...u,
      points: u.role !== "FRESHY" ? u.group.points : u.points,
      group: { id: u.group.id, name: u.group.name, nameAlt: u.group.nameAlt },
    })),
  )
}

const txPersonSelect = {
  nickname: true,
  major: true,
  group: { select: { id: true, name: true, nameAlt: true } },
} as const

// GET /users/me
export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.appUser.findUnique({
    where: { id: req.user.id },
    select: { ...userSelect },
  })

  if (!user) return reply.code(404).send({ error: "User not found" })

  const rank = user.role === "FRESHY" ? await getRankById(user.id) : null
  const points = user.role !== "FRESHY" ? user.group.points : user.points
  const { group, ...rest } = user

  const txWhere =
    user.role === "FRESHY"
      ? { receiverId: user.id }
      : { stationId: user.group.id }

  const transactions = await prisma.pointTransaction.findMany({
    where: txWhere,
    select: {
      amount: true,
      createdAt: true,
      giver: { select: txPersonSelect },
      receiver: { select: txPersonSelect },
    },
    orderBy: { createdAt: "desc" },
  })

  const history = transactions.map((tx) => ({
    action: user.role === "FRESHY" ? "receive" : "give",
    amount: tx.amount,
    createdAt: tx.createdAt,
    giver: tx.giver,
    receiver: tx.receiver,
  }))

  return reply.send({
    ...rest,
    points,
    group: { id: group.id, name: group.name, nameAlt: group.nameAlt },
    rank,
    history,
  })
}

// GET /users/code/:code
export async function getUserByCode(
  req: FastifyRequest<{ Params: Static<typeof GetUserByCodeParams> }>,
  reply: FastifyReply,
) {
  const user = await prisma.appUser.findUnique({
    where: { userCode: req.params.code },
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      nickname: true,
      userCode: true,
      role: true,
      major: true,
      points: true,
      group: { select: { name: true, nameAlt: true, points: true } },
    },
  })

  if (!user) return reply.code(404).send({ error: "User not found" })
  return reply.send({
    ...user,
    points: user.role !== "FRESHY" ? user.group.points : user.points,
    group: user.group.name,
    groupAlt: user.group.nameAlt,
  })
}
