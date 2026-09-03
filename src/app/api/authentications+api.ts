import { connectToDatabase } from '@/lib/mongodb';
import { createAuthToken } from '@/lib/auth-tokens';

/**
 * POST /api/authentications - Authenticate a user and issue a JWT token
 * (Compliant with UniTN EasyLib authentication architecture)
 */
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { username, email, password } = body;

    const identifier = (username || email || '').trim().toLowerCase();

    if (!identifier) {
      return Response.json(
        { success: false, error: 'Username o email richiesti per l\'autenticazione' },
        { status: 400 }
      );
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { email: { $regex: new RegExp(`^${identifier}$`, 'i') } },
      ],
    });

    if (!user) {
      return Response.json(
        { success: false, error: 'Autenticazione fallita. Utente non trovato.' },
        { status: 401 }
      );
    }

    // Verify password if provided on user record
    if (user.password && password && user.password !== password) {
      return Response.json(
        { success: false, error: 'Autenticazione fallita. Password errata.' },
        { status: 401 }
      );
    }

    // Sign JWT token
    const token = createAuthToken({
      username: user.username,
      email: user.email,
      isModerator: user.isModerator || false,
    });

    return Response.json(
      {
        success: true,
        message: 'Enjoy your token!',
        token,
        user: {
          username: user.username,
          email: user.email,
          isModerator: user.isModerator || false,
          profilePicEmoji: user.profilePicEmoji || '🦊',
          profilePicColor: user.profilePicColor || '#D8B4F8',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/authentications failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
