import "dotenv/config"
import "./types/index.js"
import Fastify from "fastify"
import rateLimit from "@fastify/rate-limit"
import { corsPlugin } from "./plugins/cors.js"
import { cookiePlugin } from "./plugins/cookie.js"
import { jwtPlugin } from "./plugins/jwt.js"
import { authRoutes } from "./modules/auth/auth.route.js"
import { usersRoutes } from "./modules/users/users.route.js"
import { pointsRoutes } from "./modules/points/points.route.js"
import { leaderboardRoutes } from "./modules/leaderboard/leaderboard.route.js"
import { configsRoutes } from "./modules/configs/configs.route.js"
import { auditsRoutes } from "./modules/audits/audits.route.js"
import { config } from "./config.js"

// trustProxy: true — ให้ Fastify อ่าน real IP จาก X-Forwarded-For ที่ nginx ส่งมา
// (จำเป็นสำหรับ rate limit ให้นับ per user ไม่ใช่ per proxy IP)
const app = Fastify({ logger: true, trustProxy: true })

await app.register(corsPlugin)
await app.register(rateLimit, { global: false })
await app.register(cookiePlugin)
await app.register(jwtPlugin)

await app.register(authRoutes, { prefix: "/api/auth" })
await app.register(usersRoutes, { prefix: "/api/users" })
await app.register(pointsRoutes, { prefix: "/api/points" })
await app.register(leaderboardRoutes, { prefix: "/api/leaderboard" })
await app.register(configsRoutes, { prefix: "/api/configs" })
await app.register(auditsRoutes, { prefix: "/api/audits" })

app.listen({ port: config.port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
