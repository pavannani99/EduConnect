import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import TakeQuizForm from '@/components/quizzes/TakeQuizForm';

interface TakeQuizPageProps {
  params: {
    id: string;
  };
}

async function getQuiz(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: {
        select: {
          id: true,
          content: true,
          type: true,
          options: true,
          points: true,
        },
      },
      attempts: {
        where: {
          studentId: session.user.id,
        },
      },
    },
  });

  if (!quiz) return null;

  return quiz;
}

export default async function TakeQuizPage({
  params,
}: TakeQuizPageProps) {
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    notFound();
  }

  const now = new Date();
  const isActive = now >= quiz.startTime && now <= quiz.endTime;
  const hasSubmitted = quiz.attempts.some(attempt => attempt.submittedAt);

  if (hasSubmitted) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-600">
            You have already submitted this quiz.
          </div>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            This quiz is not currently active.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{quiz.title}</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Quiz Details</h2>
          <p className="text-gray-600 mb-4">{quiz.description}</p>
          <div className="text-sm text-gray-500">
            <p>Subject: {quiz.subject.name}</p>
            <p>Duration: {quiz.duration} minutes</p>
            <p>Total Questions: {quiz.questions.length}</p>
          </div>
        </div>

        <Suspense fallback={<div>Loading quiz...</div>}>
          <TakeQuizForm
            quizId={quiz.id}
            questions={quiz.questions}
            duration={quiz.duration}
          />
        </Suspense>
      </div>
    </div>
  );
} 