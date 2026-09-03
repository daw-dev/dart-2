import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// POST /api/dartworks/like - Toggle like on an artwork (Auth Required)
export async function POST(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { artworkId } = body;
    const username = auth.user.username;

    if (!artworkId) {
      return Response.json({ error: 'artworkId is required' }, { status: 400 });
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(artworkId);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const dArtWorksCollection = db.collection('dartworks');
    const dArtWorkDoc = await dArtWorksCollection.findOne({ _id: artObjectId });
    if (!dArtWorkDoc) {
      return Response.json({ error: 'D\'ArtWork not found' }, { status: 404 });
    }

    const isLiked = Array.isArray(dArtWorkDoc.likes) && dArtWorkDoc.likes.includes(username);
    if (isLiked) {
      await dArtWorksCollection.updateOne(
        { _id: artObjectId },
        { $pull: { likes: username } as any }
      );
    } else {
      await dArtWorksCollection.updateOne(
        { _id: artObjectId },
        { $addToSet: { likes: username } as any }
      );
    }

    return Response.json({ success: true, isLiked: !isLiked });
  } catch (error: any) {
    console.error('POST /api/dartworks/like failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
