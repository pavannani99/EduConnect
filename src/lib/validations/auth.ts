import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  collegeId: z.string().optional(),
  collegeName: z.string().optional(),
  collegeDomain: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema> 