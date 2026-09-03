import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// POST /api/dartworks/[id]/like - Toggle like on an artwork by URL ID (Auth Required)
export async function POST(request: Request, { params }: { params?: { id?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const body = await request.json().catch(() => ({}));
    
    let id = params?.id;
    if (!id && segments.length >= 3 && segments[segments.length - 1] === 'like' && segments[segments.length - 2] !== 'dartworks') {
      id = segments[segments.length - 2];
    }
    if (!id) {
      id = body?.artworkId || '';
    }

    const username = auth.user.username;

    if (!id) {
      return Response.json({ error: 'artworkId is required' }, { status: 400 });
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(id);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
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
    console.error('POST /api/dartworks/[id]/like failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
