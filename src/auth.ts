import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        // Verify lock status
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const passwordsMatch = bcrypt.compareSync(password, user.passwordHash);

        if (passwordsMatch) {
          // Reset failed attempts on success
          if (user.failedLoginAttempts > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: null },
            });
          }

          // Return user object for session
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        // Increment failed attempts on failure
        const nextAttempts = user.failedLoginAttempts + 1;
        const shouldLock = nextAttempts >= 5;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: nextAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 mins lock
          },
        });

        // Audit failed login attempt
        await prisma.auditLog.create({
          data: {
            id: `AL-${Date.now()}`,
            eventType: 'AUTH_LOGIN_FAILURE',
            entityType: 'User',
            entityId: user.id,
            actorId: user.id,
            actorRole: user.role,
            ipAddress: '127.0.0.1',
            userAgent: 'system',
            deviceFingerprint: 'system',
            sessionId: 'login-attempt',
            before: undefined,
            after: undefined,
            reason: `Failed password login. Attempt ${nextAttempts}/5.`,
            immutableHash: 'audit-log-failed-auth-hash',
          },
        });

        return null;
      },
    }),
  ],
});
