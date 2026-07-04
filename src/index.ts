import "dotenv/config"
import "./types/index.js"
import Fastify from "fastify"
import { corsPlugin } from "./plugins/cors.js"
import { cookiePlugin } from "./plugins/cookie.js"
import { jwtPlugin } from "./plugins/jwt.js"
import { authRoutes } from "./modules/auth/auth.route.js"
import { usersRoutes } from "./modules/users/users.route.js"
import { pointsRoutes } from "./modules/points/points.route.js"
import { leaderboardRoutes } from "./modules/leaderboard/leaderboard.route.js"
import { configsRoutes } from "./modules/configs/configs.route.js"
import { config } from "./config.js"

const app = Fastify({ logger: true })

await app.register(corsPlugin)
await app.register(cookiePlugin)
await app.register(jwtPlugin)

await app.register(authRoutes, { prefix: "/api/auth" })
await app.register(usersRoutes, { prefix: "/api/users" })
await app.register(pointsRoutes, { prefix: "/api/points" })
await app.register(leaderboardRoutes, { prefix: "/api/leaderboard" })
await app.register(configsRoutes, { prefix: "/api/configs" })

app.listen({ port: config.port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
