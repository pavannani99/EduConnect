import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
})

// Create a new subject
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const json = await req.json()
    const body = subjectSchema.parse(json)

    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      include: { members: true }
    })

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      )
    }

    // Check if user is a member or owner of the classroom
    if (!classroom.members.some(member => member.id === session.user.id) && classroom.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this classroom to add subjects' },
        { status: 403 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name: body.name,
        code: body.code,
        classroomId: params.id,
      },
      include: {
        _count: {
          select: { notes: true }
        }
      }
    })

    return NextResponse.json(subject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all subjects in a classroom
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      include: {
        members: true,
        subjects: {
          include: {
            _count: {
              select: { notes: true }
            }
          }
        }
      }
    })

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      )
    }

    // Check if user is a member or owner of the classroom
    if (!classroom.members.some(member => member.id === session.user.id) && classroom.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this classroom to view subjects' },
        { status: 403 }
      )
    }

    return NextResponse.json(classroom.subjects)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 