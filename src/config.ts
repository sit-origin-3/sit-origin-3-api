export const config = {
  port: Number(process.env["PORT"]) || 8080,
  jwtSecret: process.env["JWT_SECRET"] ?? "dev-jwt-secret",
  jwtRefreshSecret: process.env["JWT_REFRESH_SECRET"] ?? "dev-refresh-secret",
  jwtExpiresIn: "24h",
  refreshExpiresIn: "7d",
}
