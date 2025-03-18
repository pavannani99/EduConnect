import { useState } from 'react';
import { Assignment, AssignmentSubmission } from '@prisma/client';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CreateAssignment from './CreateAssignment';

type AssignmentWithSubmission = Assignment & {
  submissions: Pick<AssignmentSubmission, 'id' | 'submittedAt' | 'grade'>[];
};

interface AssignmentListProps {
  subjectId: string;
  isTeacher: boolean;
}

export default function AssignmentList({ subjectId, isTeacher }: AssignmentListProps) {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?subjectId=${subjectId}`);
      const data = await response.json();
      if (response.ok) {
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchAssignments();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignments</h2>
        {isTeacher && (
          <Button onClick={() => setShowCreateForm(true)}>
            Create Assignment
          </Button>
        )}
      </div>

      {showCreateForm && (
        <CreateAssignment
          subjectId={subjectId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{assignment.title}</h3>
                <p className="text-gray-600">{assignment.description}</p>
                <p className="text-sm text-gray-500">
                  Due: {format(new Date(assignment.dueDate), 'PPP')}
                </p>
              </div>
              <div className="text-right">
                {assignment.submissions.length > 0 ? (
                  <div>
                    <p className="text-sm text-green-600">Submitted</p>
                    {assignment.submissions[0].grade && (
                      <p className="text-sm">
                        Grade: {assignment.submissions[0].grade}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Navigate to submission page
                      window.location.href = `/assignments/${assignment.id}/submit`;
                    }}
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 