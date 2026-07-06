import type { FastifyInstance } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./points.controller.js"
import * as schema from "./points.schema.js"

export async function pointsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()
  server.post(
    "/give",
    {
      schema: { body: schema.GiveBulkPointsBody },
      preHandler: [hook.requireRole("STAFF", "ADMIN")],
    },
    controller.giveBulkPoints,
  )

  server.post(
    "/assign",
    {
      schema: { body: schema.AssignPointsBody },
      preHandler: [hook.requireRole("ADMIN")],
    },
    controller.assignPoints,
  )
}
