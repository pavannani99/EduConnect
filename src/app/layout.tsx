import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Sidebar } from '@/components/Sidebar'; // Import the Sidebar
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduConnect',
  description: 'A collaborative platform for students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-100`}> {/* Changed bg-gray-50 to bg-gray-100 for better contrast */}
        <AuthProvider>
          <div className="flex"> {/* Flex container for Sidebar and main content */}
            <Sidebar />
            <main className="flex-1 ml-64 p-6"> {/* Adjust ml to sidebar width and add padding */}
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 