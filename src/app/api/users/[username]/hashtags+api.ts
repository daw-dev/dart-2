import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// PATCH /api/users/[username]/hashtags - Update hashtags for user in URL (Auth Required)
export async function PATCH(request: Request, { params }: { params?: { username?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const username = params?.username || segments[segments.length - 2] || auth.user.username;

    const body = await request.json();
    const { hashtags } = body;

    if (!Array.isArray(hashtags)) {
      return Response.json({ error: 'Hashtags must be an array of strings' }, { status: 400 });
    }

    const cleanedHashtags = hashtags.map((h: string) => h.replace(/^#/, '').trim()).filter(Boolean);

    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { username: { $regex: new RegExp(`^${username}$`, 'i') } },
      { $set: { hashtags: cleanedHashtags } }
    );

    return Response.json({ success: true, hashtags: cleanedHashtags }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/users/[username]/hashtags failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
