import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// AuthProvider and ToastProvider will be wrapped in a client component
import { ClientProviders } from '@/components/providers/ClientProviders';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduConnect',
  description: 'A collaborative platform for students',
  // Add manifest if you have one for PWA features
  // manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}> {/* Use theme variables */}
        <ClientProviders> {/* This will contain AuthProvider, ToastProvider, and Toaster */}
          <div className="flex">
            <Sidebar /> {/* Sidebar can be a client or server component as needed */}
            <main className="flex-1 ml-64 p-4 md:p-6 lg:p-8 bg-background"> {/* Use theme variable and responsive padding */}
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
} 