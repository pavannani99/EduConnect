import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET messages for a classroom
export async function GET(
  request: Request,
  { params }: { params: { classroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { classroomId } = params;

  try {
    // Check if user is a member of the classroom
    const classroomMember = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!classroomMember) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this classroom.' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { classroomId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true }, // Select only necessary sender fields
        },
      },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message to a classroom
export async function POST(
  request: Request,
  { params }: { params: { classroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { classroomId } = params;
  const { content } = await request.json();

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
  }

  try {
    // Check if user is a member of the classroom
    const classroomMember = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!classroomMember) {
      return NextResponse.json({ error: 'Forbidden: You cannot send messages to this classroom.' }, { status: 403 });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        classroomId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // TODO: Implement real-time broadcasting of the message (e.g., via WebSockets)
    // For now, just return the created message.

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
