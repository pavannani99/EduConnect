import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, attachments } = await req.json();
    const assignmentId = params.id;

    // Check if assignment exists and is not past due date
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (new Date() > assignment.dueDate) {
      return NextResponse.json(
        { error: 'Assignment is past due date' },
        { status: 400 }
      );
    }

    // Check if student has already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: session.user.id,
      },
    });

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          attachments: attachments || [],
          submittedAt: new Date(),
        },
      });
      return NextResponse.json(updatedSubmission);
    }

    // Create new submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        content,
        attachments: attachments || [],
        assignmentId,
        studentId: session.user.id,
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    );
  }
} 