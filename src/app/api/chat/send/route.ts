import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content, classroomId } = await req.json();

    if (!content || !classroomId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

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

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        classroomId,
      },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    // Trigger the pusher event
    await pusher.trigger(`classroom-${classroomId}`, 'new-message', {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      createdAt: message.createdAt,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('[CHAT_SEND]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 