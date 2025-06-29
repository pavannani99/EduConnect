"use client";

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast, ToastMessage as ToastMessageType } from '@/context/ToastContext'; // Renamed to avoid conflict
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Using outline icons

export interface ToastProps extends ToastMessageType {}

const toastVariants = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-destructive text-destructive-foreground border-destructive/50', // Using theme variable
  info: 'bg-blue-500 border-blue-600',
  warning: 'bg-yellow-500 border-yellow-600',
};

const iconVariants = {
  success: <CheckCircleIcon className="h-6 w-6 text-white" />,
  error: <XCircleIcon className="h-6 w-6 text-destructive-foreground" />, // Using theme variable for icon if needed
  info: <InformationCircleIcon className="h-6 w-6 text-white" />,
  warning: <ExclamationTriangleIcon className="h-6 w-6 text-white" />,
};


export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000 }) => {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, removeToast]);

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border',
        'mb-4 transition-all duration-300 ease-in-out animate-toast-in', // Added animation class
        toastVariants[type] || 'bg-gray-700 border-gray-800', // Default if type is unknown
        type === 'error' ? 'text-destructive-foreground' : 'text-white' // Ensure text color for error
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {iconVariants[type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={() => removeToast(id)}
              className={cn(
                "inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2",
                type === 'error' ? "text-destructive-foreground/70 hover:text-destructive-foreground focus:ring-destructive-foreground" : "text-white/70 hover:text-white focus:ring-white"
              )}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
