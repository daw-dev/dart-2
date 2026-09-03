import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// GET /api/dartworks/[id]/comments - List comments for an artwork
export async function GET(request: Request, { params }: { params?: { id?: string } } = {}) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = params?.id || segments[segments.length - 2] || '';

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(id);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const rawComments = await db.collection('comments').find({ artworkId: artObjectId }).toArray();

    const comments = rawComments.map((c) => ({
      id: c._id.toString(),
      artworkId: id,
      username: c.username,
      text: c.text,
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Di recente',
      parentId: c.parentId ? c.parentId.toString() : undefined,
    }));

    return Response.json(comments, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/dartworks/[id]/comments failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/dartworks/[id]/comments - Add a new comment to an artwork (Auth Required)
export async function POST(request: Request, { params }: { params?: { id?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = params?.id || segments[segments.length - 2] || '';

    const body = await request.json();
    const commentData = body?.comment || body;
    const text = commentData?.text || '';
    const parentId = commentData?.parentId;
    const username = auth.user.username;

    if (!id || !text) {
      return Response.json({ error: 'Artwork ID and comment text are required' }, { status: 400 });
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(id);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const commentDoc: any = {
      artworkId: artObjectId,
      username,
      text,
      createdAt: new Date(),
    };

    if (parentId) {
      try {
        commentDoc.parentId = new ObjectId(parentId);
      } catch {
        commentDoc.parentId = parentId;
      }
    }

    const result = await db.collection('comments').insertOne(commentDoc);
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/dartworks/[id]/comments failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
