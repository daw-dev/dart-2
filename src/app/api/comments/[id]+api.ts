import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// DELETE /api/comments/[id] - Remove a comment by URL parameter (Auth Required)
export async function DELETE(request: Request, { params }: { params?: { id?: string } } = {}) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const url = new URL(request.url);
    const id = params?.id || url.pathname.split('/').pop() || '';

    if (!id) {
      return Response.json({ error: 'commentId is required in URL' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    let query: any = { _id: id };
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      query = { _id: id };
    }

    await db.collection('comments').deleteOne(query);
    await db.collection('reports').deleteMany({ targetId: id });

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/comments/[id] failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
