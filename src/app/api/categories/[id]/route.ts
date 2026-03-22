import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Category from '@/models/category.model';
import { z } from 'zod';

const renameCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  const body = await req.json();
  const parsed = renameCategorySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await dbConnect();

  const category = await Category.findById(id);

  if (!category) {
    return Response.json({ error: 'Category not found' }, { status: 404 });
  }

  if (category.userId.toString() !== (session.user as { id: string }).id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    category.name = parsed.data.name;
    await category.save();

    return Response.json({ category: JSON.parse(JSON.stringify(category)) });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      return Response.json(
        { error: 'A category with that name already exists.' },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  await dbConnect();

  const category = await Category.findById(id);

  if (!category) {
    return Response.json({ error: 'Category not found' }, { status: 404 });
  }

  if (category.userId.toString() !== (session.user as { id: string }).id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (category.isDefault) {
    return Response.json(
      { error: 'Default categories cannot be deleted' },
      { status: 400 }
    );
  }

  await category.deleteOne();

  return Response.json({ ok: true });
}
