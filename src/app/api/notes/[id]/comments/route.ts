import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
})

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
    const body = commentSchema.parse(json)

    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          include: {
            classroom: {
              include: {
                members: true
              }
            }
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    // Check if user is a member or owner of the classroom
    if (!note.subject.classroom.members.some(member => member.id === session.user.id) && 
        note.subject.classroom.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this classroom to comment' },
        { status: 403 }
      )
    }

    const comment = await prisma.noteComment.create({
      data: {
        content: body.content,
        noteId: params.id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(comment)
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

// Get all comments for a note
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

    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          include: {
            classroom: {
              include: {
                members: true
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    // Check if user is a member or owner of the classroom
    if (!note.subject.classroom.members.some(member => member.id === session.user.id) && 
        note.subject.classroom.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this classroom to view comments' },
        { status: 403 }
      )
    }

    return NextResponse.json(note.comments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 