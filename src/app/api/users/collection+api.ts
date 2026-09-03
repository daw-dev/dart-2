import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// POST /api/users/collection - Update or toggle favorite artwork in user's collection (max 3) (Auth Required)
export async function POST(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { artworkId, collection } = body;
    const username = auth.user.username;

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Direct collection replacement
    if (Array.isArray(collection)) {
      const limited = collection.slice(0, 3);
      const objectIds = limited
        .map((id: string) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      await usersCollection.updateOne({ username }, { $set: { collection: objectIds } });
      return Response.json({ success: true, collection: limited }, { status: 200 });
    }

    // Toggle single artwork
    if (artworkId) {
      let artObjectId: ObjectId;
      try {
        artObjectId = new ObjectId(artworkId);
      } catch {
        return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
      }

      const collectionStrings = Array.isArray(user.collection)
        ? user.collection.map((id: any) => id.toString())
        : [];
      const isFav = collectionStrings.includes(artworkId);

      if (isFav) {
        await usersCollection.updateOne({ username }, { $pull: { collection: artObjectId } as any });
      } else {
        if (collectionStrings.length >= 3) {
          return Response.json({ error: 'Collection is full (max 3)' }, { status: 400 });
        }
        await usersCollection.updateOne({ username }, { $push: { collection: artObjectId } as any });
      }

      return Response.json({ success: true, isFavorite: !isFav }, { status: 200 });
    }

    return Response.json({ error: 'Either artworkId or collection array is required' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/users/collection failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
