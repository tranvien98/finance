import type { NextAuthConfig } from 'next-auth';

// Minimal Auth Config that is fully completely compatible with Edge Runtime
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      if (trigger === 'update' && session?.user) {
        token.id = (session.user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [], // Add actual providers in the Node runtime config (auth.ts)
} satisfies NextAuthConfig;
