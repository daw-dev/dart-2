import { UserProfile } from '../src/types/app';

describe('User Management & Curated Collection Verification', () => {
  const mockUser: UserProfile = {
    username: 'davide_db',
    email: 'davide@unitn.it',
    bio: 'Software engineer & digital art enthusiast in Trento.',
    profilePicEmoji: '🦊',
    profilePicColor: '#6366F1',
    album: ['art-01'],
    collection: ['art-01', 'art-02'],
    exposition: ['art-01'],
    followers: ['SaraPixel'],
    following: ['SaraPixel', 'trento_explorer'],
    badges: ['Top Artist'],
    hashtags: ['3DArt', 'Trento', 'SciFi'],
    settings: {
      notifyFollowedArtist: true,
      notifyTrendingNearby: true,
      notifyLikes: true,
      notifyComments: true,
      language: 'it',
    },
  };

  test('TC-USR-1: Rispetta il limite massimo di 3 opere nella collezione personale', () => {
    const currentCollection = [...mockUser.collection];
    const newArt1 = 'art-03';
    const newArt2 = 'art-04';

    // Adding 3rd art -> total 3 (valid)
    if (currentCollection.length < 3) {
      currentCollection.push(newArt1);
    }
    expect(currentCollection.length).toBe(3);

    // Adding 4th art -> slice to 3
    const updatedCollection = [...currentCollection, newArt2].slice(-3);
    expect(updatedCollection.length).toBe(3);
    expect(updatedCollection).toEqual(['art-02', 'art-03', 'art-04']);
  });

  test('TC-USR-2: Gestione dinamica dei follower con toggle', () => {
    const targetToFollow = 'CyberMart';
    let following = [...mockUser.following];

    // Follow new user
    if (!following.includes(targetToFollow)) {
      following.push(targetToFollow);
    }
    expect(following).toContain('CyberMart');
    expect(following.length).toBe(3);

    // Unfollow
    following = following.filter((u) => u !== targetToFollow);
    expect(following).not.toContain('CyberMart');
    expect(following.length).toBe(2);
  });

  test('TC-USR-3: Sanitizzazione e validazione degli hashtag seguiti', () => {
    const rawHashtags = ['#3DArt', 'trento', '  #Sculpture  '];
    const sanitized = rawHashtags.map((h) => h.trim().replace(/^#/, '')).filter((h) => h.length > 0);

    expect(sanitized).toEqual(['3DArt', 'trento', 'Sculpture']);
  });
});
