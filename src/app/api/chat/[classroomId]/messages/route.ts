import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { classroomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const classroomId = params.classroomId;

    // Check if user is part of the classroom
    const membership = await prisma.classroomMember.findFirst({
      where: {
        userId: session.user.id,
        classroomId,
      },
    });

    if (!membership) {
      return new NextResponse('Not a member of this classroom', { status: 403 });
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        classroomId,
      },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100, // Limit to last 100 messages
    });

    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      createdAt: message.createdAt,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('[MESSAGES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 