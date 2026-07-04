import { Type } from "@sinclair/typebox"

export const LoginBody = Type.Object({
  identifier: Type.String(), // email หรือ studentId
  password: Type.String(),
})
