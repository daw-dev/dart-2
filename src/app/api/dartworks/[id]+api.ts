import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { mapDBDArtWorkToFrontend, buildNestedComments } from '@/lib/api-helpers';
import { authenticateRequest } from '@/lib/auth-tokens';

// GET /api/dartworks/[id] - Fetch single artwork by ID
export async function GET(request: Request, { params }: { params?: { id?: string } } = {}) {
  try {
    const url = new URL(request.url);
    const id = params?.id || url.pathname.split('/').pop() || '';

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(id);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const art = await db.collection('dartworks').findOne({ _id: artObjectId });
    if (!art) {
      return Response.json({ error: 'D\'ArtWork not found' }, { status: 404 });
    }

    const rawComments = await db.collection('comments').find({ artworkId: artObjectId }).toArray();
    const rawAsset = art.assetId ? await db.collection('assets').findOne({ _id: art.assetId }) : null;

    const formattedComments = rawComments.map((c) => ({
      id: c._id.toString(),
      artworkId: id,
      username: c.username,
      text: c.text,
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Appena adesso',
      parentId: c.parentId ? c.parentId.toString() : undefined,
    }));

    const nestedComments = buildNestedComments(formattedComments);
    const dArtWork = mapDBDArtWorkToFrontend(art, nestedComments, rawAsset || undefined);

    return Response.json(dArtWork, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/dartworks/[id] failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/dartworks/[id] - Remove artwork by URL parameter (Auth Required)
export async function DELETE(request: Request, { params }: { params?: { id?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    let id = params?.id || url.pathname.split('/').pop() || '';
    if (!id || id === 'dartworks') {
      try {
        const body = await request.json();
        id = body?.artworkId || '';
      } catch {}
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(id);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('dartworks').deleteOne({ _id: artObjectId });
    await db.collection('assets').deleteMany({ artworkId: artObjectId });
    await db.collection('comments').deleteMany({ artworkId: artObjectId });
    await db.collection('reports').deleteMany({ targetId: id });

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/dartworks/[id] failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
