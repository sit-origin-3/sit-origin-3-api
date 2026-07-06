import fp from "fastify-plugin"
import cors from "@fastify/cors"

export const corsPlugin = fp(async (app) => {
  await app.register(cors, {
    origin: ["http://localhost:5173", "SIT-Origin.sit.kmutt.ac.th"],
    credentials: true,
    exposedHeaders: ["Content-Type", "Cache-Control"],
  })
})
