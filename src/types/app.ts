export interface ContentReport {
  id: string;
  targetId: string;
  targetType: 'artwork' | 'comment';
  reporterUsername: string;
  category: 'offensive' | 'copyright' | 'spam' | 'danger';
  reason?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  artworkId: string;
  username: string;
  text: string;
  createdAt: string;
  replies?: Comment[];
  isSensitive?: boolean;
}

export interface Asset {
  id: string;
  artworkId: string;
  name: string;
  url: string;
  scale: number;
  rotation: number;
  createdAt: string;
}

export interface DArtWork {
  id: string;
  title: string;
  artist: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  hashtags: string[];
  likesCount: number;
  likedByUsernames: string[];
  comments: Comment[];
  preview?: string;
  assetId?: string;
  scale?: number;
  rotation?: number;
  createdAt: string;
  durationHours: number;
  isExpired?: boolean;
  expirationDate?: string;
  license?: string;
  viewsCount?: number;
  reportsCount?: number;
  isSensitive?: boolean;
}

export interface UserProfile {
  username: string;
  email: string;
  bio: string;
  profilePicColor: string;
  profilePicEmoji: string;
  album: string[];
  collection: string[];
  exposition: string[];
  followers: string[];
  following: string[];
  badges: string[];
  hashtags?: string[];
  password?: string;
  isModerator?: boolean;
  settings: {
    notifyFollowedArtist: boolean;
    notifyTrendingNearby: boolean;
    notifyLikes: boolean;
    notifyComments: boolean;
    language?: 'it' | 'en';
  };
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}
