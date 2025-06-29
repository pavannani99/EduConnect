import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const joinClassroomSchema = z.object({
  inviteCode: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { classroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { classroomId } = params;
  let body;
  try {
    const rawBody = await request.json().catch(() => ({})); // Handle cases with no body or non-JSON body
    body = joinClassroomSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    // It might be a JSON parsing error if request.json() failed before Zod.
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }


  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Check if user is part of the same college (unless ADMIN)
    if (session.user.role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: {id: session.user.id }});
        if (user?.collegeId !== classroom.collegeId) {
            return NextResponse.json({ error: 'You can only join classrooms in your own college.' }, { status: 403 });
        }
    }


    const isAlreadyMember = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        members: {
          some: { id: session.user.id },
        },
      },
    });

    if (isAlreadyMember) {
      return NextResponse.json({ error: 'You are already a member of this classroom' }, { status: 400 });
    }

    if (classroom.isPrivate) {
      if (!body.inviteCode) {
        return NextResponse.json({ error: 'Invite code is required for private classrooms' }, { status: 400 });
      }
      if (classroom.inviteCode !== body.inviteCode) {
        return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
      }
    }

    // Add user to classroom
    await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        members: {
          connect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json({ message: 'Successfully joined classroom' }, { status: 200 });
  } catch (error) {
    console.error('Error joining classroom:', error);
    return NextResponse.json({ error: 'Failed to join classroom' }, { status: 500 });
  }
}
