import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import * as z from 'zod'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  collegeId: z.string(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = registerSchema.parse(json)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Verify college exists and email domain matches
    const college = await prisma.college.findUnique({
      where: { id: body.collegeId }
    })

    if (!college) {
      return NextResponse.json(
        { error: 'Selected college not found' },
        { status: 400 }
      )
    }

    const [, emailDomain] = body.email.split('@')
    if (emailDomain !== college.domain) {
      return NextResponse.json(
        { error: `Email must be from the ${college.domain} domain` },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(body.password, 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        collegeId: body.collegeId,
      },
    })

    // Remove password from response
    const { password: _, ...result } = user

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 