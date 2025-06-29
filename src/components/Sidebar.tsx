"use client"; // Add this directive for client-side interactivity

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ArrowLeftOnRectangleIcon, HomeIcon, UserGroupIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

export function Sidebar() {
  const { data: session } = useSession();

  return (
    <div className="bg-gray-800 text-white w-64 h-screen flex flex-col fixed top-0 left-0"> {/* Added h-screen, fixed, top-0, left-0 */}
      <div className="p-4 text-2xl font-bold border-b border-gray-700">EduConnect</div>
      <nav className="flex-1 mt-4">
        <ul>
          <li>
            <Link href="/dashboard" className="flex items-center p-4 hover:bg-gray-700 transition-colors duration-200">
              <HomeIcon className="h-6 w-6 mr-3" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/classrooms" className="flex items-center p-4 hover:bg-gray-700 transition-colors duration-200">
              <UserGroupIcon className="h-6 w-6 mr-3" />
              Classrooms
            </Link>
          </li>
          <li>
            <Link href="/messages" className="flex items-center p-4 hover:bg-gray-700 transition-colors duration-200">
              <ChatBubbleLeftEllipsisIcon className="h-6 w-6 mr-3" />
              Messages
            </Link>
          </li>
        </ul>
      </nav>
      {session && (
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => signOut()}
            className="flex items-center w-full p-3 text-left text-red-400 hover:bg-red-700 hover:text-white rounded-md transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 