import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/auth-tokens';

// POST /api/comments - Add a new comment or reply to an artwork (Auth Required)
export async function POST(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { artworkId, comment } = body;

    const username = auth.user.username;
    if (!artworkId || !comment || !comment.text) {
      return Response.json({ error: 'artworkId, username, and text are required' }, { status: 400 });
    }

    let artObjectId: ObjectId;
    try {
      artObjectId = new ObjectId(artworkId);
    } catch {
      return Response.json({ error: 'Invalid D\'ArtWork ID' }, { status: 400 });
    }

    const commentObjectId = new ObjectId();
    let parentObjectId: ObjectId | undefined = undefined;
    if (comment.parentId) {
      try {
        parentObjectId = new ObjectId(comment.parentId);
      } catch {
        // Keep undefined if not valid ObjectId
      }
    }

    const dbComment = {
      _id: commentObjectId,
      artworkId: artObjectId,
      username,
      text: comment.text,
      createdAt: new Date(),
      ...(parentObjectId ? { parentId: parentObjectId } : {}),
    };

    await db.collection('comments').insertOne(dbComment);

    return Response.json({ success: true, id: commentObjectId.toString() }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/comments failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/comments - Delete a comment (Auth Required)
export async function DELETE(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return Response.json({ error: 'commentId is required' }, { status: 400 });
    }

    let commentObjectId: ObjectId;
    try {
      commentObjectId = new ObjectId(commentId);
    } catch {
      return Response.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    // Delete the comment and any direct replies
    await db.collection('comments').deleteMany({
      $or: [{ _id: commentObjectId }, { parentId: commentObjectId }],
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/comments failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
