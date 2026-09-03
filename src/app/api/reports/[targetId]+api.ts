import { connectToDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// DELETE /api/reports/[targetId] - Dismiss reports for targetId from URL (Auth Required)
export async function DELETE(request: Request, { params }: { params?: { targetId?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const targetId = params?.targetId || url.pathname.split('/').pop() || '';

    if (!targetId) {
      return Response.json({ error: 'targetId is required in URL' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('reports').deleteMany({ targetId });

    return Response.json({ success: true, message: 'Reports dismissed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/reports/[targetId] failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
