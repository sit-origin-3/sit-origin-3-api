import type { FastifyInstance } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./configs.controller.js"
import * as schema from "./configs.schema.js"

export async function configsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()

  // GET /api/configs
  server.get("/", { preHandler: [hook.requireRole("ADMIN", "STAFF")] }, controller.getConfigs)

  // PATCH /api/configs/:key
  server.patch(
    "/:key",
    {
      schema: { params: schema.UpdateConfigParams, body: schema.UpdateConfigBody },
      preHandler: [hook.requireRole("ADMIN")],
    },
    controller.updateConfig,
  )
}
