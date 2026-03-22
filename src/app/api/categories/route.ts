import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Category from '@/models/category.model';
import { DEFAULT_CATEGORIES } from '@/models/expense.model';
import { z } from 'zod';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const userId = (session.user as { id: string }).id;

  let categories = await Category.find({ userId }).sort({ name: 1 }).lean();

  if (categories.length === 0) {
    // Seed 8 default categories for new user
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((name) => ({ userId, name, isDefault: true })),
      { ordered: false }
    ).catch(() => {
      // Ignore duplicate key errors (concurrent requests)
    });

    categories = await Category.find({ userId }).sort({ name: 1 }).lean();
  }

  return Response.json({ categories: JSON.parse(JSON.stringify(categories)) });
}

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required.').max(100).trim(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await dbConnect();

  const userId = (session.user as { id: string }).id;

  try {
    const category = await Category.create({
      userId,
      name: parsed.data.name,
      isDefault: false,
    });

    return Response.json(
      { category: JSON.parse(JSON.stringify(category)) },
      { status: 201 }
    );
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
