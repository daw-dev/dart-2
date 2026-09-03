import { connectToDatabase } from '@/lib/mongodb';

// POST /api/users/[username]/follow - Toggle follow on target artist in URL
export async function POST(request: Request, { params }: { params?: { username?: string } } = {}) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const targetUsername = params?.username || segments[segments.length - 2] || '';

    const body = await request.json();
    const myUsername = body?.myUsername || body?.username;

    if (!myUsername || !targetUsername) {
      return Response.json({ error: 'myUsername and targetUsername are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    const me = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${myUsername}$`, 'i') },
    });
    const target = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${targetUsername}$`, 'i') },
    });

    if (!me || !target) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = Array.isArray(me.following) && me.following.includes(target.username);
    if (isFollowing) {
      await usersCollection.updateOne(
        { _id: me._id },
        { $pull: { following: target.username } as any }
      );
      await usersCollection.updateOne(
        { _id: target._id },
        { $pull: { followers: me.username } as any }
      );
    } else {
      await usersCollection.updateOne(
        { _id: me._id },
        { $addToSet: { following: target.username } as any }
      );
      await usersCollection.updateOne(
        { _id: target._id },
        { $addToSet: { followers: me.username } as any }
      );
    }

    return Response.json({ success: true, isFollowing: !isFollowing }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/users/[username]/follow failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
