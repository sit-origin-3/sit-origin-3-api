import { Type } from "@sinclair/typebox"

export const ConfigKey = Type.Union([
  Type.Literal("ALLOW_GIVE_POINT"),
  Type.Literal("MAX_POINTS_PER_FRESHY"),
  Type.Literal("SHOW_LEADERBOARD"),
])

export const UpdateConfigParams = Type.Object({
  key: ConfigKey,
})

export const UpdateConfigBody = Type.Object({
  value: Type.String(),
})
