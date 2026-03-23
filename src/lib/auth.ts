import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/user.model';
import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase().trim(),
        });

        if (!user) {
          throw new Error('Incorrect email or password. Please try again.');
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );
        if (!isValid) {
          throw new Error('Incorrect email or password. Please try again.');
        }

        return {
          id: user._id.toString(),
          email: user.email,
        };
      },
    }),
  ],
});
