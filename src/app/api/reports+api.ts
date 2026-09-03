import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// GET /api/reports - Fetch all active content reports
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const rawReports = await db.collection('reports').find({}).sort({ createdAt: -1 }).toArray();

    const reports = rawReports.map((r) => ({
      id: r._id.toString(),
      targetId: r.targetId ? r.targetId.toString() : '',
      targetType: r.targetType || 'artwork',
      reporterUsername: r.reporterUsername || 'anonymous',
      category: r.category || 'offensive',
      reason: r.reason || '',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    return Response.json(reports, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/reports failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/reports - Submit a new report for an artwork or comment (Auth Required)
export async function POST(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { targetId, targetType, category, reason } = body;
    const reporterUsername = auth.user.username;

    if (!targetId) {
      return Response.json({ error: 'targetId is required' }, { status: 400 });
    }

    const validCategories = ['offensive', 'copyright', 'spam', 'danger'];
    const validCategory = validCategories.includes(category) ? category : 'offensive';

    const reportId = new ObjectId();
    const dbReport = {
      _id: reportId,
      targetId,
      targetType: targetType || 'artwork',
      reporterUsername,
      category: validCategory,
      reason: reason || '',
      createdAt: new Date(),
    };

    await db.collection('reports').insertOne(dbReport);

    // If target is artwork, increment reportsCount
    if (targetType === 'artwork') {
      try {
        const artObjectId = new ObjectId(targetId);
        await db.collection('dartworks').updateOne(
          { _id: artObjectId },
          { $inc: { reportsCount: 1 } }
        );
      } catch {
        // Target ID might not be ObjectId
      }
    }

    return Response.json({ success: true, id: reportId.toString() }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/reports failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/reports - Dismiss/resolve reports for a given targetId (Auth Required)
export async function DELETE(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { targetId } = body;

    if (!targetId) {
      return Response.json({ error: 'targetId is required' }, { status: 400 });
    }

    await db.collection('reports').deleteMany({ targetId });

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/reports failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
