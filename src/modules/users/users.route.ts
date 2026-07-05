import type { FastifyInstance } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./users.controller.js"
import * as schema from "./users.schema.js"

export async function usersRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()

  // GET /users — ดึงข้อมูล user ทั้งหมด (ADMIN)
  server.get("/", { preHandler: [hook.requireRole("ADMIN")] }, controller.getAllUsers)

  // GET /users/me — ดึงข้อมูลตัวเอง + transaction history
  server.get("/me", { preHandler: [hook.requireAuth] }, controller.getMe)

  // GET /users/code/:code — ค้นหา user จาก 4-digit code (scan QR / manual search)
  server.get(
    "/code/:code",
    {
      schema: { params: schema.GetUserByCodeParams },
      preHandler: [hook.requireRole("STAFF", "ADMIN")],
    },
    controller.getUserByCode,
  )
}
