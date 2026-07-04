import fp from "fastify-plugin"
import cookie from "@fastify/cookie"

export const cookiePlugin = fp(async (app) => {
  await app.register(cookie)
})
