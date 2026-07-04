import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
import { config } from "../../config.js"
import type { LoginBody } from "./auth.schema.js"

// POST /auth/login
export async function login(
  req: FastifyRequest<{ Body: Static<typeof LoginBody> }>,
  reply: FastifyReply
) {
  const { identifier, password } = req.body

  const user = await prisma.appUser.findFirst({
    where: {
      OR: [{ email: identifier }, { studentId: identifier }],
      password,
    },
    include: { group: true },
  })

  if (!user) {
    return reply.code(401).send({ error: "Invalid credentials" })
  }

  const token = req.server.jwt.sign(
    { id: user.id, role: user.role },
    { expiresIn: config.jwtExpiresIn }
  )

  return reply.send({
    token,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      nickname: user.nickname,
      role: user.role,
      group: user.group.name,
      userCode: user.userCode,
      points: user.points,
    },
  })
}
