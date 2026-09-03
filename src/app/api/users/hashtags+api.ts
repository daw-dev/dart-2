import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// PATCH /api/users/hashtags - Update artist style hashtags (Auth Required)
export async function PATCH(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { hashtags } = body;
    const username = auth.user.username;

    if (!Array.isArray(hashtags)) {
      return Response.json({ error: 'hashtags array is required' }, { status: 400 });
    }

    const cleanTags = hashtags.map((h: string) => h.replace('#', '').trim()).filter((h: string) => h.length > 0);

    await db.collection('users').updateOne(
      { username: { $regex: new RegExp(`^${username}$`, 'i') } },
      { $set: { hashtags: cleanTags } }
    );

    return Response.json({ success: true, hashtags: cleanTags }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/users/hashtags failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}
