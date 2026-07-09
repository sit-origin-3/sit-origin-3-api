import type { FastifyInstance, FastifyRequest } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import * as controller from "./auth.controller.js"
import * as schema from "./auth.schema.js"

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()

  // POST /auth/login — จำกัด 10 ครั้ง ต่อ 1 บัญชี (identifier) ต่อ 5 นาที
  // ใช้ identifier แทน IP เพราะผู้ใช้ทุกคนอาจอยู่หลัง WiFi/NAT เดียวกัน (public IP เดียวกัน)
  server.post(
    "/login",
    {
      schema: { body: schema.LoginBody },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "5 minute",
          keyGenerator: (req: FastifyRequest) => {
            const body = req.body as { identifier?: string } | undefined
            return body?.identifier ?? req.ip
          },
          errorResponseBuilder: (_req: FastifyRequest) => ({
            error: "Too many login attempts, please try again in a few minutes",
          }),
        },
      },
    },
    controller.login,
  )

  // POST /auth/logout
  server.post("/logout", controller.logout)
}
