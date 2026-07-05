const jwtSecret = process.env["JWT_SECRET"]
const jwtRefreshSecret = process.env["JWT_REFRESH_SECRET"]

if (!jwtSecret) throw new Error("JWT_SECRET must be set")
if (!jwtRefreshSecret) throw new Error("JWT_REFRESH_SECRET must be set")

export const config = {
  port: Number(process.env["PORT"]) || 8080,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: "24h",
  refreshExpiresIn: "7d",
}
