/**
 * TypeScript type definitions mapping 1:1 with MongoDB validation schemas
 * defined in the "dart" database collections: users, badges, comments, and dartworks.
 * 
 * Note: ObjectId fields are represented as strings here, which is how they 
 * are serialized when transmitted over the REST API between backend and frontend.
 */

export interface DBBadge {
  _id: string; // ObjectId
  title: string;
  description: string;
  icon: string; // URL or emoji icon
  criteria: string; // Explanation on how to obtain the badge
}

export interface DBComment {
  _id: string; // ObjectId
  artworkId: string; // ObjectId referencing the DBDArtWork
  username: string;
  text: string;
  createdAt: string; // ISO DateTime string
  parentId?: string; // ObjectId referencing parent comment if this is a reply
}

export interface DBAsset {
  _id: string; // ObjectId
  artworkId: string; // ObjectId referencing DBDArtWork
  name: string;
  url: string; // Base64 Data URI or external CDN URL
  scale: number; // Spatial scale factor (e.g. 0.8, 1.0, 1.5, 2.0)
  rotation: number; // Rotation in degrees (0 - 360)
  createdAt: string; // ISO DateTime string
}

export interface DBDArtWork {
  _id: string; // ObjectId
  title: string;
  artist: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  hashtags: string[];
  likes: string[]; // Array of usernames who liked this D'ArtWork
  preview: string; // URL of the preview image
  assetId: string; // ObjectId referencing the DBAsset record in assets collection
  creationDate: string; // ISO string (BSON Date)
  expirationDate: string; // ISO DateTime string (BSON Date)
}

export interface DBUserProfile {
  _id: string; // ObjectId
  username: string;
  email: string;
  bio: string;
  profilePicColor: string; // Hex color code (e.g. '#ff4757')
  profilePicEmoji: string; // Emoji character representing avatar
  album: string[]; // Array of ObjectIds referencing visited D'ArtWorks
  collection: string[]; // Array of ObjectIds referencing favorite D'ArtWorks (max 3)
  exposition: string[]; // Array of ObjectIds referencing published D'ArtWorks
  followers: string[]; // Array of usernames
  following: string[]; // Array of usernames
  badges: string[]; // Array of ObjectIds referencing Badge documents
  hashtags?: string[]; // Array of artist artistic style tags (e.g. ['StreetArt', '3D'])
  password: string; // User password
}
