import { connectToDatabase } from '@/lib/mongodb';

// POST /api/users/follow - Toggle follow status between users
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { myUsername, targetUsername } = body;

    if (!myUsername || !targetUsername) {
      return Response.json({ error: 'myUsername and targetUsername are required' }, { status: 400 });
    }

    const usersCollection = db.collection('users');
    const me = await usersCollection.findOne({ username: myUsername });
    const target = await usersCollection.findOne({ username: targetUsername });

    if (!me || !target) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = Array.isArray(me.following) && me.following.includes(targetUsername);

    if (isFollowing) {
      await usersCollection.updateOne({ username: myUsername }, { $pull: { following: targetUsername } as any });
      await usersCollection.updateOne({ username: targetUsername }, { $pull: { followers: myUsername } as any });
    } else {
      await usersCollection.updateOne({ username: myUsername }, { $push: { following: targetUsername } as any });
      await usersCollection.updateOne({ username: targetUsername }, { $push: { followers: myUsername } as any });
    }

    return Response.json({ success: true, isFollowing: !isFollowing }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/users/follow failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
