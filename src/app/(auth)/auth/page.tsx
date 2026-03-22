import { AuthForm } from '@/components/auth/auth-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finance',
};

export default function AuthPage() {
  return <AuthForm />;
}
