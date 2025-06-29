"use client";

import React from 'react';
import { useToast } from '@/context/ToastContext';
import { Toast } from './toast'; // Import the individual Toast component

export const Toaster: React.FC = () => {
  const { toasts } = useToast();

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex flex-col items-end justify-start px-4 py-6 sm:items-end sm:justify-start sm:p-6 z-[100]" // High z-index
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {/* Toasts will appear here */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
          />
        ))}
      </div>
    </div>
  );
};
