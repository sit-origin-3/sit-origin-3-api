import type { FastifyInstance, FastifyRequest } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import * as controller from "./auth.controller.js"
import * as schema from "./auth.schema.js"

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()

  // POST /auth/login — จำกัด 20 ครั้ง ต่อ IP ต่อ 1 นาที
  server.post(
    "/login",
    {
      schema: { body: schema.LoginBody },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "5 minute",
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
