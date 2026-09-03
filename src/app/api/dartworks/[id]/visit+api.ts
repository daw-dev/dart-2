import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/dartworks/[id]/visit - Increment AR view count by URL ID (RF3)
export async function POST(request: Request, { params }: { params?: { id?: string } } = {}) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = params?.id || segments[segments.length - 2] || '';

    if (!id) {
      return Response.json({ error: 'artworkId is required in URL' }, { status: 400 });
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(id);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('dartworks').updateOne(
      { _id: artObjectId },
      { $inc: { viewsCount: 1 } }
    );

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/dartworks/[id]/visit failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
