import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// PATCH /api/users/avatar - Update user profile avatar emoji and/or color (Auth Required)
export async function PATCH(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { emoji, color } = body;
    const username = auth.user.username;

    const updateFields: any = {};
    if (emoji) updateFields.profilePicEmoji = emoji;
    if (color) updateFields.profilePicColor = color;

    await db.collection('users').updateOne(
      { username: { $regex: new RegExp(`^${username}$`, 'i') } },
      { $set: updateFields }
    );

    return Response.json({ success: true, ...updateFields }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/users/avatar failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}
