import type { FastifyRequest, FastifyReply } from "fastify"
import type { Static } from "@sinclair/typebox"
import bcrypt from "bcrypt"
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
    },
    include: { group: { select: { id: true, name: true, nameAlt: true, points: true } } },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    if (user) {
      await createAuditLog({
        actorId: user.id,
        action: "LOGIN",
        status: "FAILED",
        metadata: { reason: "wrong_password" },
      })
    }
    return reply.code(401).send({ error: "Invalid credentials" })
  }

  await createAuditLog({ actorId: user.id, action: "LOGIN" })

  const token = req.server.jwt.sign(
    { id: user.id, role: user.role },
    { expiresIn: config.jwtExpiresIn }
  )

  const isCrossOrigin = process.env["NODE_ENV"] === "production"
  reply.setCookie("token", token, {
    httpOnly: true,
    sameSite: isCrossOrigin ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    secure: isCrossOrigin,
  })

  return reply.send({
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      nickname: user.nickname,
      role: user.role,
      group: user.group.name,
      groupAlt: user.group.nameAlt,
      userCode: user.userCode,
      points: user.role !== "FRESHY" ? user.group.points : user.points,
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
