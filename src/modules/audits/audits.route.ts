import type { FastifyInstance } from "fastify"
import * as hook from "../../hooks/auth.hook.js"
import * as controller from "./audits.controller.js"

export async function auditsRoutes(app: FastifyInstance) {
  // GET /api/audits?page=1&limit=50&action=LOGIN
  app.get("/", { preHandler: [hook.requireRole("ADMIN")] }, controller.getAuditLogs)
}
