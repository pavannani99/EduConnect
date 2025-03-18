import 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    collegeId?: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    collegeId?: string;
  }
} 