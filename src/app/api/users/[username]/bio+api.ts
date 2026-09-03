import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// PATCH /api/users/[username]/bio - Update bio for user in URL (Auth Required)
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
    const { bio } = body;

    if (typeof bio !== 'string') {
      return Response.json({ error: 'Bio string is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { username: { $regex: new RegExp(`^${username}$`, 'i') } },
      { $set: { bio: bio.slice(0, 350) } }
    );

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/users/[username]/bio failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
