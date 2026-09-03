import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// PATCH /api/users/bio - Update user biography (Auth Required)
export async function PATCH(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { bio } = body;
    const username = auth.user.username;

    if (typeof bio !== 'string') {
      return Response.json({ error: 'bio is required' }, { status: 400 });
    }

    const limitedBio = bio.slice(0, 350);
    await db.collection('users').updateOne({ username }, { $set: { bio: limitedBio } });

    return Response.json({ success: true, bio: limitedBio }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/users/bio failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}
