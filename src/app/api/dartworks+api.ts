import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { mapDBDArtWorkToFrontend, buildNestedComments } from '@/lib/api-helpers';
import { authenticateRequest } from '@/lib/auth-tokens';

// GET /api/dartworks - Fetch all artworks with nested comments and associated assets
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const rawDArtWorks = await db.collection('dartworks').find({}).toArray();
    const rawComments = await db.collection('comments').find({}).toArray();
    const rawAssets = await db.collection('assets').find({}).toArray();

    // 1. Group comments by artworkId
    const commentsMap: Record<string, any[]> = {};
    rawComments.forEach((c) => {
      const artId = c.artworkId ? c.artworkId.toString() : '';
      if (artId) {
        if (!commentsMap[artId]) {
          commentsMap[artId] = [];
        }
        commentsMap[artId].push({
          id: c._id.toString(),
          artworkId: artId,
          username: c.username,
          text: c.text,
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Appena adesso',
          parentId: c.parentId ? c.parentId.toString() : undefined,
        });
      }
    });

    // 2. Map assets by artworkId and by _id
    const assetsByArtId: Record<string, any> = {};
    const assetsById: Record<string, any> = {};
    rawAssets.forEach((asset) => {
      const assetIdStr = asset._id.toString();
      assetsById[assetIdStr] = asset;
      if (asset.artworkId) {
        assetsByArtId[asset.artworkId.toString()] = asset;
      }
    });

    // 3. Map artworks attaching comments and asset descriptors
    const dArtWorks = rawDArtWorks.map((art) => {
      const artIdStr = art._id.toString();
      const artComments = commentsMap[artIdStr] || [];
      const nestedComments = buildNestedComments(artComments);
      const assetDoc =
        (art.assetId && assetsById[art.assetId.toString()]) ||
        assetsByArtId[artIdStr] ||
        undefined;

      return mapDBDArtWorkToFrontend(art, nestedComments, assetDoc);
    });

    return Response.json(dArtWorks, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/dartworks failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/dartworks - Publish a new D'ArtWork and create its spatial Asset record (Auth Required)
export async function POST(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { dArtWork } = body;

    const artist = auth.user.username;
    if (!dArtWork || !dArtWork.title) {
      return Response.json({ error: 'Title and artist are required' }, { status: 400 });
    }

    const artObjectId = new ObjectId();
    const assetObjectId = new ObjectId();

    const previewUrl = dArtWork.preview || '';

    // 1. Create Asset document with scale, rotation, and URL
    const dbAsset = {
      _id: assetObjectId,
      artworkId: artObjectId,
      name: dArtWork.title || 'asset',
      url: previewUrl,
      scale: typeof dArtWork.scale === 'number' ? dArtWork.scale : 1.0,
      rotation: typeof dArtWork.rotation === 'number' ? dArtWork.rotation : 0,
      createdAt: new Date(),
    };
    await db.collection('assets').insertOne(dbAsset);

    // 2. Create D'ArtWork document linking assetId and preview
    const dbDArtWork = {
      _id: artObjectId,
      title: dArtWork.title,
      artist,
      description: dArtWork.description || '',
      locationName: dArtWork.locationName || 'Trento',
      latitude: Number(dArtWork.latitude) || 46.0697,
      longitude: Number(dArtWork.longitude) || 11.1211,
      hashtags: dArtWork.hashtags || [],
      likes: [],
      preview: previewUrl,
      assetId: assetObjectId,
      creationDate: new Date(),
      expirationDate: new Date(Date.now() + (dArtWork.durationHours || 48) * 60 * 60 * 1000),
    };
    await db.collection('dartworks').insertOne(dbDArtWork);

    await db.collection('users').updateOne(
      { username: artist },
      { $push: { exposition: artObjectId } as any }
    );

    return Response.json(
      {
        success: true,
        insertedId: artObjectId.toString(),
        assetId: assetObjectId.toString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/dartworks failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/dartworks - Remove a D'ArtWork (moderation or artist) and cascade delete assets (Auth Required)
export async function DELETE(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { artworkId } = body;

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(artworkId);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    await db.collection('dartworks').deleteOne({ _id: artObjectId });
    await db.collection('assets').deleteMany({ artworkId: artObjectId });
    await db.collection('comments').deleteMany({ artworkId: artObjectId });
    await db.collection('reports').deleteMany({ targetId: artworkId });

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/dartworks failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
