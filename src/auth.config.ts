import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith('/dashboard') || 
                          nextUrl.pathname.startsWith('/transactions') || 
                          nextUrl.pathname.startsWith('/reports') ||
                          nextUrl.pathname.startsWith('/accounts') ||
                          nextUrl.pathname.startsWith('/customers') ||
                          nextUrl.pathname.startsWith('/suppliers') ||
                          nextUrl.pathname.startsWith('/corrections') ||
                          nextUrl.pathname.startsWith('/settings');
      const isAdminArea = nextUrl.pathname.startsWith('/admin');

      if (isDashboard || isAdminArea) {
        if (!isLoggedIn) return false; // Redirect unauthenticated users to login
        
        // Admin area checks
        if (isAdminArea) {
          const role = auth.user?.role;
          if (role === 'ADMIN') return true;
          if (nextUrl.pathname.startsWith('/admin/users') && role === 'MAINTAINER') return true;
          return Response.redirect(new URL('/dashboard?error=AccessDenied', nextUrl));
        }
        return true;
      } else if (isLoggedIn && nextUrl.pathname.startsWith('/auth/login')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Configured in main auth.ts
} satisfies NextAuthConfig;
