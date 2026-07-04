import { Type } from "@sinclair/typebox"

export const GetUserByCodeParams = Type.Object({
  code: Type.String({ minLength: 4, maxLength: 4 }),
})
