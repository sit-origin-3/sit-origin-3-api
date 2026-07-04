import type { FastifyInstance } from "fastify"
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"

export async function configsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()
  void server
}
