import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// PATCH /api/users/[username]/avatar - Update avatar emoji and color for user in URL (Auth Required)
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
    const { emoji, color } = body;

    const updateFields: Record<string, any> = {};
    if (emoji) updateFields.profilePicEmoji = emoji;
    if (color) updateFields.profilePicColor = color;

    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { username: { $regex: new RegExp(`^${username}$`, 'i') } },
      { $set: updateFields }
    );

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/users/[username]/avatar failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
