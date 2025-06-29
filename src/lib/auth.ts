import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { trackUserActivity } from './analytics'; // Import the tracking function

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        // Track login activity
        // Not awaiting this, as it's a side effect and shouldn't block login
        trackUserActivity(user.id, 'USER_LOGIN', undefined, { ipAddress: credentials.ipAddress /* Example metadata if available */ });


        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  events: { // Using events for actions like sign-in
    async signIn({ user, account, profile, isNewUser }) {
      if (user.id) {
        // This is another place to track login, especially for OAuth providers if added later.
        // For credentials provider, authorize callback is often sufficient.
        // trackUserActivity(user.id, 'USER_LOGIN_EVENT');
      }
    },
    async signOut({ token, session }) {
        if(token?.id) {
            // trackUserActivity(token.id as string, 'USER_LOGOUT'); // Requires token.id to be string
        }
    }
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string; // Ensure id is string
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role as any; // Ensure role type matches
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      if (user) { // This user object comes from the provider's authorize callback or OAuth profile
        token.id = user.id;
        // @ts-ignore // user.role is custom and might not be on NextAuth's default User type
        token.role = user.role;
      }
      return token;
    },
  },
} 