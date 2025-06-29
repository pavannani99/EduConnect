"use client"; // This component now uses client-side state and actions

import { Classroom, User, UserRole } from '@prisma/client';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For re-fetching data or redirecting

interface ClassroomCardProps {
  classroom: Classroom & {
    owner: Pick<User, 'id' | 'name'>;
    _count: { members: number };
  };
  isMember: boolean;
  currentUserRole: UserRole; // To potentially disable join for admins if they manage all
  onJoinInitiated: (classroomId: string, isPrivate: boolean) => void;
}

export function ClassroomCard({ classroom, isMember, currentUserRole, onJoinInitiated }: ClassroomCardProps) {
  const router = useRouter();

  const handleViewClassroom = () => {
    router.push(`/classroom/${classroom.id}`);
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-150">
              {classroom.name}
            </h3>
            <p className="text-sm text-gray-500">Section: {classroom.section}</p>
          </div>
          {classroom.isPrivate ? (
            <span className="flex-shrink-0 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
              Private
            </span>
          ) : (
            <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Public
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          <p>Created by: {classroom.owner.name}</p>
          <p>{classroom._count.members} member(s)</p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        {isMember ? (
          <Button variant="default" size="sm" className="w-full" onClick={handleViewClassroom}>
            View Classroom
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onJoinInitiated(classroom.id, classroom.isPrivate)}
            // Potentially disable if ADMIN and they have implicit access or different management tools
            // disabled={currentUserRole === UserRole.ADMIN}
          >
            Join Classroom
          </Button>
        )}
      </div>
    </div>
  );
} 