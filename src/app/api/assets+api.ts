import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/assets - Fetch asset by artworkId or assetId
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const artworkId = url.searchParams.get('artworkId');
    const assetId = url.searchParams.get('assetId');

    const query: any = {};
    if (assetId) {
      try {
        query._id = new ObjectId(assetId);
      } catch {
        return Response.json({ error: 'Invalid assetId' }, { status: 400 });
      }
    } else if (artworkId) {
      try {
        query.artworkId = new ObjectId(artworkId);
      } catch {
        query.artworkId = artworkId;
      }
    }

    const assetsCollection = db.collection('assets');
    if (query._id || query.artworkId) {
      const asset = await assetsCollection.findOne(query);
      if (!asset) {
        return Response.json({ error: 'Asset not found' }, { status: 404 });
      }
      return Response.json(
        {
          id: asset._id.toString(),
          artworkId: asset.artworkId?.toString() || '',
          name: asset.name || 'asset',
          url: asset.url || '',
          scale: typeof asset.scale === 'number' ? asset.scale : 1.0,
          rotation: typeof asset.rotation === 'number' ? asset.rotation : 0,
          createdAt: asset.createdAt ? new Date(asset.createdAt).toISOString() : new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const rawAssets = await assetsCollection.find({}).toArray();
    const assets = rawAssets.map((asset) => ({
      id: asset._id.toString(),
      artworkId: asset.artworkId?.toString() || '',
      name: asset.name || 'asset',
      url: asset.url || '',
      scale: typeof asset.scale === 'number' ? asset.scale : 1.0,
      rotation: typeof asset.rotation === 'number' ? asset.rotation : 0,
      createdAt: asset.createdAt ? new Date(asset.createdAt).toISOString() : new Date().toISOString(),
    }));

    return Response.json(assets, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/assets failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/assets - Create or update an asset
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { artworkId, name, url, scale, rotation } = body;

    let artObjectId: ObjectId | undefined;
    if (artworkId) {
      try {
        artObjectId = new ObjectId(artworkId);
      } catch {
        // Leave undefined if not valid ObjectId
      }
    }

    const assetObjectId = new ObjectId();
    const dbAsset = {
      _id: assetObjectId,
      artworkId: artObjectId || artworkId || '',
      name: name || 'asset',
      url: url || '',
      scale: typeof scale === 'number' ? scale : 1.0,
      rotation: typeof rotation === 'number' ? rotation : 0,
      createdAt: new Date(),
    };

    await db.collection('assets').insertOne(dbAsset);

    // If artworkId was provided, update the artwork document to link assetId
    if (artObjectId) {
      await db.collection('dartworks').updateOne(
        { _id: artObjectId },
        {
          $set: {
            assetId: assetObjectId,
            preview: url || '',
          },
        }
      );
    }

    return Response.json({ success: true, id: assetObjectId.toString() }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/assets failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/assets - Delete asset
export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { assetId, artworkId } = body;

    const query: any = {};
    if (assetId) {
      try {
        query._id = new ObjectId(assetId);
      } catch {
        return Response.json({ error: 'Invalid assetId' }, { status: 400 });
      }
    } else if (artworkId) {
      try {
        query.artworkId = new ObjectId(artworkId);
      } catch {
        query.artworkId = artworkId;
      }
    } else {
      return Response.json({ error: 'assetId or artworkId is required' }, { status: 400 });
    }

    await db.collection('assets').deleteMany(query);
    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/assets failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
