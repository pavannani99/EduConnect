import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      include: {
        college: true,
        members: true,
      },
    })

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      )
    }

    // Check if user belongs to the same college
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collegeId: true },
    })

    if (user?.collegeId !== classroom.collegeId) {
      return NextResponse.json(
        { error: 'You can only join classrooms from your college' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    if (classroom.members.some(member => member.id === session.user.id)) {
      return NextResponse.json(
        { error: 'You are already a member of this classroom' },
        { status: 400 }
      )
    }

    // Add user to classroom
    const updatedClassroom = await prisma.classroom.update({
      where: { id: params.id },
      data: {
        members: {
          connect: { id: session.user.id }
        }
      },
      include: {
        college: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(updatedClassroom)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get invitation details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        section: true,
        isPrivate: true,
        college: {
          select: {
            name: true,
          }
        },
        owner: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            members: true,
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

    return NextResponse.json(classroom)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 