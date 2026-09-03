import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/dartworks/visit - Add artwork to user's album
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { username, artworkId } = body;

    if (!username || !artworkId) {
      return Response.json({ error: 'username and artworkId are required' }, { status: 400 });
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(artworkId);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const albumStrings = Array.isArray(user.album) ? user.album.map((id: any) => id.toString()) : [];
    if (!albumStrings.includes(artworkId)) {
      await usersCollection.updateOne({ username }, { $push: { album: artObjectId } as any });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/dartworks/visit failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
