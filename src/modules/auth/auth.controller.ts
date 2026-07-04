import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import { prisma } from "../../db.js"
import { config } from "../../config.js"
import { createAuditLog } from "../../lib/audit.js"
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

  await createAuditLog({ actorId: user.id, action: "LOGIN" })

  const token = req.server.jwt.sign(
    { id: user.id, role: user.role },
    { expiresIn: config.jwtExpiresIn }
  )

  reply.setCookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return reply.send({
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

// POST /auth/logout
export async function logout(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    await createAuditLog({ actorId: req.user.id, action: "LOGOUT" })
  } catch {
    // token หมดอายุหรือไม่มี ก็ยัง logout ได้
  }
  reply.clearCookie("token", { path: "/" })
  return reply.send({ success: true })
}
