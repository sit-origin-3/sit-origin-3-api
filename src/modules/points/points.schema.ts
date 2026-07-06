import { Type } from "@sinclair/typebox"

export const GiveBulkPointsBody = Type.Object({
  receiverCodes: Type.Array(Type.String({ minLength: 4, maxLength: 4 }), { minItems: 1 }),
  amount: Type.Number({ minimum: 1 }),
})

export const AssignPointsBody = Type.Object({
  userCode: Type.String({ minLength: 4, maxLength: 4 }),
  amount: Type.Number({ minimum: 1 }),
})
