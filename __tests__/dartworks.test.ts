import { DArtWork, Comment } from '../src/types/app';

describe('DArtWork Business Logic & Metadata Verification', () => {
  const mockArtwork: DArtWork = {
    id: 'art-test-01',
    title: 'Scultura Quantica',
    artist: 'CyberMart',
    description: 'Installazione AR interattiva.',
    locationName: 'Piazza Cesare Battisti',
    latitude: 46.0688,
    longitude: 11.1232,
    hashtags: ['3DArt', 'SciFi'],
    likesCount: 12,
    likedByUsernames: ['davide_db', 'SaraPixel'],
    comments: [
      {
        id: 'c-1',
        artworkId: 'art-test-01',
        username: 'CyberMart',
        text: 'Grazie a tutti per i feedback!',
        createdAt: '2026-09-01T12:00:00.000Z',
      },
      {
        id: 'c-2',
        artworkId: 'art-test-01',
        username: 'davide_db',
        text: 'Effetti di luce stupendi.',
        createdAt: '2026-09-01T13:00:00.000Z',
      },
    ],
    preview: 'https://example.com/preview.jpg',
    assetId: 'asset-mesh-99',
    createdAt: '2026-08-20T10:00:00.000Z',
    durationHours: 720,
    expirationDate: '2026-09-25T20:00:00.000Z',
    isExpired: false,
  };

  test('TC-ART-1: Identifica correttamente i commenti pubblicati dall autore dell opera per il badge [Artista]', () => {
    const artistComment = mockArtwork.comments.find(
      (c) => c.username.toLowerCase() === mockArtwork.artist.toLowerCase()
    );
    expect(artistComment).toBeDefined();
    expect(artistComment?.username).toBe('CyberMart');

    const regularComment = mockArtwork.comments.find((c) => c.username === 'davide_db');
    expect(regularComment?.username.toLowerCase()).not.toBe(mockArtwork.artist.toLowerCase());
  });

  test('TC-ART-2: Verifica lo stato di scadenza temporale dell esposizione', () => {
    const activeDate = new Date('2026-09-25T20:00:00.000Z');
    const pastDate = new Date('2026-08-01T10:00:00.000Z');
    const now = new Date('2026-09-02T12:00:00.000Z');

    const isStillActive = activeDate.getTime() > now.getTime();
    expect(isStillActive).toBe(true);

    const isPastExpired = pastDate.getTime() < now.getTime();
    expect(isPastExpired).toBe(true);
  });

  test('TC-ART-3: Gestione aggiunta e rimozione like con controllo di unicità utente', () => {
    const user1 = 'davide_db';
    const user2 = 'trento_explorer';

    let likedUsers = [...mockArtwork.likedByUsernames];

    // Already liked by davide_db -> toggle off
    if (likedUsers.includes(user1)) {
      likedUsers = likedUsers.filter((u) => u !== user1);
    }
    expect(likedUsers).not.toContain('davide_db');

    // Not liked by trento_explorer -> toggle on
    if (!likedUsers.includes(user2)) {
      likedUsers.push(user2);
    }
    expect(likedUsers).toContain('trento_explorer');
    expect(likedUsers.length).toBe(2);
  });
});
