import type { FastifyRequest, FastifyReply } from "fastify"

// ใช้เป็น preHandler เพื่อเช็คว่า login แล้ว
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    await reply.code(401).send({ error: "Unauthorized" })
  }
}

// ใช้เป็น preHandler เพื่อเช็ค role
// ตัวอย่าง: preHandler: [requireRole("STAFF", "ADMIN")]
export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      await reply.code(401).send({ error: "Unauthorized" })
      return
    }
    if (!roles.includes(req.user.role)) {
      await reply.code(403).send({ error: "Forbidden" })
    }
  }
}
