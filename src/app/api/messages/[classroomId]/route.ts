import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendNotificationToUsers } from '@/lib/notifications/server'; // Import push notification sender

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

    // Send push notifications to other classroom members
    if (newMessage) {
      const classroomWithMembers = await prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          members: { select: { id: true } },
          // owner: { select: { name: true } } // For sender name in notification if needed & not available on session
        },
      });

      if (classroomWithMembers && classroomWithMembers.members.length > 0) {
        const recipientIds = classroomWithMembers.members
          .map(member => member.id)
          .filter(id => id !== session.user.id); // Exclude the sender

        if (recipientIds.length > 0) {
          const notificationPayload = {
            title: `New message in ${classroomWithMembers.name}`,
            body: `${session.user.name || 'Someone'}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`, // Preview of message
            url: `/messages?classroomId=${classroomId}`, // Or `/classroom/${classroomId}/messages`
            tag: `classroom-message-${classroomId}` // Tag to potentially replace previous notifications for this classroom
          };
          // Not awaiting this, let it run in background
          sendNotificationToUsers(recipientIds, notificationPayload)
            .catch(err => console.error("Failed to send push notifications:", err));
        }
      }
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
