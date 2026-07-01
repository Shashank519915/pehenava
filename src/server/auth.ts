'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    // Use the callbackUrl submitted by the form, or fall back to /dashboard.
    // Passing an explicit relative redirectTo means NextAuth never relies on
    // NEXTAUTH_URL to build the post-login URL — this fixes the production
    // bug where the browser URL stays on /auth/login after a successful login.
    const callbackUrl = (formData.get('callbackUrl') as string | null) || '/dashboard';
    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function logOut() {
  await signOut({ redirectTo: '/' });
}
