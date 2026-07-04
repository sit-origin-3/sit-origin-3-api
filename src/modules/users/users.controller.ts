import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
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
  points: true,
  group: { select: { name: true } },
} as const

// GET /users/me
export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.appUser.findUnique({
    where: { id: req.user.id },
    select: {
      ...userSelect,
      receivedPoints: {
        select: {
          amount: true,
          createdAt: true,
          giver: { select: { nickname: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) return reply.code(404).send({ error: "User not found" })
  return reply.send(user)
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
    },
  })

  if (!user) return reply.code(404).send({ error: "User not found" })
  return reply.send(user)
}
