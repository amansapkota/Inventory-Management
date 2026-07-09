import { z } from 'zod'

export function validateWithZod<T>(schema: z.ZodType<T>) {
  return (values: unknown) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }

    const errors: Record<string, { message: string }> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!errors[path]) {
        errors[path] = { message: issue.message }
      }
    }

    return { values: {} as T, errors }
  }
}
