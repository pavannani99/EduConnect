"use client";

import { AuthProvider } from './AuthProvider'; // Assuming AuthProvider is client-compatible
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary'; // Import ErrorBoundary
import React from 'react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<DefaultErrorFallback />}> {/* Added ErrorBoundary */}
      <AuthProvider>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// A simple fallback component to show within the layout if ErrorBoundary catches something
// This is optional if the default fallback in ErrorBoundary itself is sufficient
const DefaultErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h1 className="text-xl font-semibold text-destructive">An error occurred</h1>
    <p>Sorry, something went wrong. Please try refreshing.</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      Refresh
    </button>
  </div>
);
