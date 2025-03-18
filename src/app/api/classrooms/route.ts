import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as z from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const classroomSchema = z.object({
  name: z.string().min(2),
  section: z.string().min(1),
  isPrivate: z.boolean().default(true),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'CR') {
      return NextResponse.json(
        { error: 'Only CRs can create classrooms' },
        { status: 403 }
      )
    }

    const json = await req.json()
    const body = classroomSchema.parse(json)

    // Get user's college
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collegeId: true }
    })

    if (!user?.collegeId) {
      return NextResponse.json(
        { error: 'User must be associated with a college' },
        { status: 400 }
      )
    }

    // Check if section already exists in college
    const existingClassroom = await prisma.classroom.findFirst({
      where: {
        collegeId: user.collegeId,
        section: body.section,
      },
    })

    if (existingClassroom) {
      return NextResponse.json(
        { error: 'A classroom with this section already exists in your college' },
        { status: 400 }
      )
    }

    // Create the classroom
    const classroom = await prisma.classroom.create({
      data: {
        name: body.name,
        section: body.section,
        isPrivate: body.isPrivate,
        collegeId: user.collegeId,
        ownerId: session.user.id,
        members: {
          connect: { id: session.user.id }
        }
      },
    })

    return NextResponse.json(classroom)
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