import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
})

// Create a new note
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
    const body = noteSchema.parse(json)

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        classroom: {
          include: {
            members: true
          }
        }
      }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Check if user is a member or owner of the classroom
    if (!subject.classroom.members.some(member => member.id === session.user.id) && 
        subject.classroom.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this classroom to add notes' },
        { status: 403 }
      )
    }

    const note = await prisma.note.create({
      data: {
        title: body.title,
        content: body.content,
        attachments: body.attachments || [],
        subjectId: params.id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    })

    return NextResponse.json(note)
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

// Get all notes in a subject
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

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        classroom: {
          include: {
            members: true
          }
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            _count: {
              select: { comments: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Check if user is a member or owner of the classroom
    if (!subject.classroom.members.some(member => member.id === session.user.id) && 
        subject.classroom.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this classroom to view notes' },
        { status: 403 }
      )
    }

    return NextResponse.json(subject.notes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 