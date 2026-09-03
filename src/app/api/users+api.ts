import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/users - Fetch all users with formatted badges and references
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const rawUsers = await db.collection('users').find({}).toArray();
    const rawBadges = await db.collection('badges').find({}).toArray();

    const badgeMap: Record<string, string> = {};
    rawBadges.forEach((b) => {
      badgeMap[b._id.toString()] = b.title;
    });

    const users = rawUsers.map((u) => ({
      ...u,
      _id: u._id.toString(),
      album: Array.isArray(u.album) ? u.album.map((id: any) => id.toString()) : [],
      collection: Array.isArray(u.collection) ? u.collection.map((id: any) => id.toString()) : [],
      exposition: Array.isArray(u.exposition) ? u.exposition.map((id: any) => id.toString()) : [],
      badges: Array.isArray(u.badges)
        ? u.badges.map((id: any) => badgeMap[id.toString()] || id.toString())
        : [],
      hashtags: Array.isArray(u.hashtags) ? u.hashtags : [],
      isModerator: !!u.isModerator,
      settings: {
        notifyFollowedArtist: true,
        notifyTrendingNearby: true,
        notifyLikes: true,
        notifyComments: true,
        language: 'it',
      },
    }));

    return Response.json(users, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/users failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users - Register a new user
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { username, email, newUser, password } = body;

    if (!username || !email) {
      return Response.json({ error: 'Username and email are required' }, { status: 400 });
    }

    const usersCollection = db.collection('users');
    const exists = await usersCollection.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      ],
    });

    if (exists) {
      return Response.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    const userToInsert = {
      ...(newUser || {}),
      _id: new ObjectId(),
      username,
      email,
      password: password || newUser?.password || 'password123',
      bio: newUser?.bio || 'Nuovo esploratore D\'Art',
      profilePicColor: newUser?.profilePicColor || '#D8B4F8',
      profilePicEmoji: newUser?.profilePicEmoji || '🦊',
      album: [],
      collection: [],
      exposition: [],
      followers: [],
      following: [],
      badges: [],
      hashtags: Array.isArray(newUser?.hashtags) ? newUser.hashtags : ['StreetArt'],
    };
    delete userToInsert.id;
    delete userToInsert.settings;

    await usersCollection.insertOne(userToInsert);
    return Response.json({ success: true, user: { ...userToInsert, _id: userToInsert._id.toString() } }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/users failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users - Delete a user account (GDPR erasure)
export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    await db.collection('users').deleteOne({ username });
    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/users failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
