import { connectToDatabase } from '@/lib/mongodb';
import { mapDBUserToFrontend } from '@/lib/api-helpers';
import { authenticateRequest } from '@/lib/auth-tokens';

// GET /api/users/[username] - Fetch user profile by username
export async function GET(request: Request, { params }: { params?: { username?: string } } = {}) {
  try {
    const url = new URL(request.url);
    const username = params?.username || url.pathname.split('/').pop() || '';

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(mapDBUserToFrontend(user), { status: 200 });
  } catch (error: any) {
    console.error('GET /api/users/[username] failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users/[username] - GDPR Account Deletion (Auth Required)
export async function DELETE(request: Request, { params }: { params?: { username?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const username = params?.username || url.pathname.split('/').pop() || '';

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('users').deleteOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/users/[username] failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
