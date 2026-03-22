export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/expenses/:path*', '/dashboard/:path*', '/settings/:path*', '/investments/:path*'],
};
