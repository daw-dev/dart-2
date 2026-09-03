import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your MongoDB connection string to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db('dart');
  await seedDatabase(db);
  return { client: mongoClient, db };
}

// Seed initial data if collections are empty
async function seedDatabase(db: Db) {
  const usersCollection = db.collection('users');
  const dArtWorksCollection = db.collection('dartworks');

  const usersCount = await usersCollection.countDocuments();
  if (usersCount === 0) {
    console.log('Seeding initial mock users into MongoDB...');
    await usersCollection.insertMany([
      {
        username: 'DArtTeam',
        email: 'team@dart.it',
        bio: "Il team ufficiale di D'Art. Portiamo la street art nel futuro con la AR!",
        profilePicColor: '#FF6B6B',
        profilePicEmoji: '🎨',
        album: [],
        collection: [],
        exposition: ['art-1', 'art-3'],
        followers: ['davide_db', 'TrentoArt'],
        following: [],
        badges: ['Artista Emergente', 'Esperto D\'Art'],
        settings: {
          notifyFollowedArtist: true,
          notifyTrendingNearby: true,
          notifyLikes: true,
          notifyComments: true
        }
      },
      {
        username: 'TrentoArt',
        email: 'trento.art@gmail.com',
        bio: "Esploratore e creatore urbano. Amante dell'architettura e delle sculture 3D.",
        profilePicColor: '#4D96FF',
        profilePicEmoji: '🗿',
        album: ['art-1'],
        collection: ['art-1'],
        exposition: ['art-2'],
        followers: ['DArtTeam'],
        following: ['DArtTeam'],
        badges: ['Artista Emergente'],
        settings: {
          notifyFollowedArtist: true,
          notifyTrendingNearby: true,
          notifyLikes: true,
          notifyComments: true
        }
      },
      {
        username: 'EcoArtist',
        email: 'green.eco@live.com',
        bio: "Arte ecologica e sostenibile. Piantiamo alberi digitali a Trento.",
        profilePicColor: '#6BCB77',
        profilePicEmoji: '🌿',
        album: [],
        collection: [],
        exposition: ['art-4'],
        followers: [],
        following: [],
        badges: ['Artista Emergente'],
        hashtags: ['Botanical', 'EcoArt', 'Nature', 'Luminous'],
        settings: {
          notifyFollowedArtist: true,
          notifyTrendingNearby: false,
          notifyLikes: true,
          notifyComments: true
        }
      },
      {
        username: 'davide_db',
        email: 'davide.dallabetta@studenti.unitn.it',
        bio: "Studente dell'Università di Trento, appassionato di street art.",
        profilePicColor: '#D8B4F8',
        profilePicEmoji: '🦊',
        album: ['art-1', 'art-2', 'art-4'],
        collection: ['art-1', 'art-2'],
        exposition: [],
        followers: [],
        following: ['DArtTeam', 'TrentoArt'],
        badges: ['Frenetico'],
        hashtags: ['3DArt', 'StreetArt', 'Cyberpunk', 'Trento'],
        settings: {
          notifyFollowedArtist: true,
          notifyTrendingNearby: true,
          notifyLikes: false,
          notifyComments: true
        }
      }
    ]);
  }

  const dArtWorksCount = await dArtWorksCollection.countDocuments();
  if (dArtWorksCount === 0) {
    console.log('Seeding initial mock D\'ArtWorks into MongoDB...');
    await dArtWorksCollection.insertMany([
      {
        id: 'art-1',
        title: 'Wizard Dante',
        artist: 'DArtTeam',
        description: "Una statua 3D animata di Dante Alighieri che lancia incantesimi colorati sulla piazza.",
        locationName: 'Piazza Dante',
        latitude: 46.0718,
        longitude: 11.1197,
        hashtags: ['3DArt', 'Fantasy', 'Graffiti'],
        likesCount: 42,
        likedByUsernames: ['TrentoArt', 'davide_db'],
        comments: [
          {
            id: 'c-1',
            artworkId: 'art-1',
            username: 'davide_db',
            text: 'Assolutamente fantastico! Sembra vero quando lo inquadri con la fotocamera.',
            createdAt: '2 ore fa',
            replies: [
              {
                id: 'c-2',
                artworkId: 'art-1',
                username: 'DArtTeam',
                text: 'Grazie Davide! Abbiamo lavorato molto sull\'animazione della toga.',
                createdAt: '1 ora fa'
              }
            ]
          },
          {
            id: 'c-3',
            artworkId: 'art-1',
            username: 'TrentoArt',
            text: 'Un ottimo uso dei volumi 3D in questa area. Complimenti!',
            createdAt: '1 giorno fa'
          }
        ],
        preview: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=80',
        createdAt: '2 giorni fa',
        durationHours: 48
      },
      {
        id: 'art-2',
        title: 'Nettuno Cyberpunk',
        artist: 'TrentoArt',
        description: "Una reinterpretazione futuristica del Nettuno con getti d'acqua olografici in realtà aumentata.",
        locationName: 'Piazza Duomo',
        latitude: 46.0669,
        longitude: 11.1215,
        hashtags: ['Realismo', '3DArt', 'Colorful'],
        likesCount: 15,
        likedByUsernames: ['davide_db'],
        comments: [
          {
            id: 'c-4',
            artworkId: 'art-2',
            username: 'davide_db',
            text: 'I neon attorno alla statua sono spettacolari di notte!',
            createdAt: '3 ore fa'
          }
        ],
        preview: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
        createdAt: '1 giorno fa',
        durationHours: 24
      },
      {
        id: 'art-3',
        title: 'Castle Guardian',
        artist: 'DArtTeam',
        description: "Un enorme dragone colorato che si avvolge attorno alla torre del castello.",
        locationName: 'Castello del Buonconsiglio',
        latitude: 46.0712,
        longitude: 11.1276,
        hashtags: ['Fantasy', 'Graffiti'],
        likesCount: 29,
        likedByUsernames: ['DArtTeam'],
        comments: [],
        preview: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
        createdAt: '3 giorni fa',
        durationHours: 72
      },
      {
        id: 'art-4',
        title: 'Eco-Tree',
        artist: 'EcoArtist',
        description: "Un albero luminoso gigante le cui foglie cambiano colore in base ai commenti degli utenti.",
        locationName: 'Torre Civica',
        latitude: 46.0673,
        longitude: 11.1218,
        hashtags: ['Colorful', 'Cartoon'],
        likesCount: 33,
        likedByUsernames: ['davide_db', 'DArtTeam'],
        comments: [
          {
            id: 'c-5',
            artworkId: 'art-4',
            username: 'DArtTeam',
            text: 'Idea fantastica! L\'interazione tra commenti e colore è geniale.',
            createdAt: '4 ore fa'
          }
        ],
        preview: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
        createdAt: '12 ore fa',
        durationHours: 96
      }
    ]);
  }
}
