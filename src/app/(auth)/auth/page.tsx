import { AuthForm } from '@/components/auth/auth-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập',
};

export default function AuthPage() {
  return <AuthForm />;
}
