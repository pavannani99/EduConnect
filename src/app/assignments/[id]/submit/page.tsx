import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import SubmitAssignmentForm from '@/components/assignments/SubmitAssignmentForm';

interface SubmitAssignmentPageProps {
  params: {
    id: string;
  };
}

async function getAssignment(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: session.user.id,
        },
      },
    },
  });

  if (!assignment) return null;

  return assignment;
}

export default async function SubmitAssignmentPage({
  params,
}: SubmitAssignmentPageProps) {
  const assignment = await getAssignment(params.id);

  if (!assignment) {
    notFound();
  }

  const isPastDue = new Date() > assignment.dueDate;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Assignment Details</h2>
          <p className="text-gray-600 mb-4">{assignment.description}</p>
          <div className="text-sm text-gray-500">
            <p>Subject: {assignment.subject.name}</p>
            <p>Due Date: {assignment.dueDate.toLocaleString()}</p>
          </div>
        </div>

        {isPastDue ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            This assignment is past due and can no longer be submitted.
          </div>
        ) : (
          <Suspense fallback={<div>Loading submission form...</div>}>
            <SubmitAssignmentForm
              assignmentId={assignment.id}
              existingSubmission={assignment.submissions[0]}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
} 