import type { FastifyInstance } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import * as controller from "./auth.controller.js"
import * as schema from "./auth.schema.js"

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()

  // POST /auth/login
  server.post("/login", { schema: { body: schema.LoginBody } }, controller.login)

  // POST /auth/logout
  server.post("/logout", controller.logout)
}
