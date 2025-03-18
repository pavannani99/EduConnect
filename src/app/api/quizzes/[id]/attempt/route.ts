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

    const { responses } = await req.json();
    const quizId = params.id;

    // Check if quiz exists and is within time window
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (now < quiz.startTime || now > quiz.endTime) {
      return NextResponse.json(
        { error: 'Quiz is not currently active' },
        { status: 400 }
      );
    }

    // Check if student has already submitted
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: session.user.id,
        submittedAt: { not: null },
      },
    });

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'You have already submitted this quiz' },
        { status: 400 }
      );
    }

    // Calculate score
    let totalScore = 0;
    const questionResponses = responses.map((response: any) => {
      const question = quiz.questions.find(q => q.id === response.questionId);
      let isCorrect = false;
      let points = 0;

      if (question) {
        if (question.type === 'MULTIPLE_CHOICE') {
          const correctOption = (question.options as any[]).find(opt => opt.isCorrect);
          isCorrect = correctOption && response.answer === correctOption.text;
        } else {
          isCorrect = question.answer === response.answer;
        }
        points = isCorrect ? question.points : 0;
        totalScore += points;
      }

      return {
        questionId: response.questionId,
        answer: response.answer,
        isCorrect,
        points,
      };
    });

    // Create or update attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: session.user.id,
        submittedAt: now,
        score: totalScore,
        responses: {
          create: questionResponses,
        },
      },
      include: {
        responses: true,
      },
    });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
} 