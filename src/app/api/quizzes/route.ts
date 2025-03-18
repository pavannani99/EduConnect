import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { QuestionType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, subjectId, startTime, endTime, duration, questions } = await req.json();

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        subjectId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        questions: {
          create: questions.map((q: any) => ({
            content: q.content,
            type: q.type as QuestionType,
            options: q.options,
            answer: q.answer,
            points: q.points,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { subjectId },
      include: {
        questions: {
          select: {
            id: true,
            content: true,
            type: true,
            points: true,
          },
        },
        attempts: {
          where: {
            studentId: session.user.id,
          },
          select: {
            id: true,
            startedAt: true,
            submittedAt: true,
            score: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
} 