import { Type } from "@sinclair/typebox"

export const ConfigKey = Type.Union([Type.Literal("ALLOW_GIVE_POINT")])

export const UpdateConfigParams = Type.Object({
  key: ConfigKey,
})

export const UpdateConfigBody = Type.Object({
  value: Type.String(),
})
