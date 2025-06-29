"use client";

import { AuthProvider } from './AuthProvider'; // Assuming AuthProvider is client-compatible
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import React from 'react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </AuthProvider>
  );
}
