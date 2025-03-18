import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as z from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const collegeSchema = z.object({
  name: z.string().min(2, 'College name must be at least 2 characters'),
  domain: z.string().email('Must be a valid email domain'),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create colleges' },
        { status: 403 }
      )
    }

    const json = await req.json()
    const body = collegeSchema.parse(json)

    // Check if college already exists
    const existingCollege = await prisma.college.findUnique({
      where: { domain: body.domain }
    })

    if (existingCollege) {
      return NextResponse.json(
        { error: 'A college with this domain already exists' },
        { status: 400 }
      )
    }

    // Create the college
    const college = await prisma.college.create({
      data: {
        name: body.name,
        domain: body.domain,
      },
    })

    return NextResponse.json(college)
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

export async function GET(req: Request) {
  try {
    const colleges = await prisma.college.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        domain: true,
      },
    })

    return NextResponse.json(colleges)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 