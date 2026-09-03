import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// POST /api/users/[username]/collection - Update curated favorites (max 3) for user in URL (Auth Required)
export async function POST(request: Request, { params }: { params?: { username?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const username = params?.username || segments[segments.length - 2] || auth.user.username;

    const body = await request.json();
    const { artworkId, collection } = body;

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    const userDoc = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });
    if (!userDoc) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedCollection: any[] = [];
    if (Array.isArray(collection)) {
      updatedCollection = collection
        .slice(0, 3)
        .map((id: string) => {
          try {
            return new ObjectId(id);
          } catch {
            return id;
          }
        });
    } else if (artworkId) {
      const existing: any[] = Array.isArray(userDoc.collection) ? userDoc.collection : [];
      const artIdStr = artworkId.toString();
      const isAlreadyIn = existing.some((id: any) => id.toString() === artIdStr);

      if (isAlreadyIn) {
        updatedCollection = existing.filter((id: any) => id.toString() !== artIdStr);
      } else {
        updatedCollection = [...existing];
        if (updatedCollection.length >= 3) {
          updatedCollection.shift();
        }
        try {
          updatedCollection.push(new ObjectId(artworkId));
        } catch {
          updatedCollection.push(artworkId);
        }
      }
    }

    await usersCollection.updateOne(
      { _id: userDoc._id },
      { $set: { collection: updatedCollection } }
    );

    return Response.json({
      success: true,
      collection: updatedCollection.map((id) => id.toString()),
    });
  } catch (error: any) {
    console.error('POST /api/users/[username]/collection failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
