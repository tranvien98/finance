import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/user.model';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({
      email: parsed.data.email.toLowerCase().trim(),
    });
    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists. Sign in instead.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      email: parsed.data.email.toLowerCase().trim(),
      hashedPassword,
    });

    return Response.json(
      { id: user._id.toString(), email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
