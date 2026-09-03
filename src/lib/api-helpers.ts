import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to map DB dArtWork and its Asset document to the format expected by the frontend
export function mapDBDArtWorkToFrontend(art: any, nestedComments: any[] = [], assetDoc?: any) {
  if (!art) return null;

  // Calculate durationHours
  const creation = art.creationDate ? new Date(art.creationDate) : new Date();
  const expiration = art.expirationDate ? new Date(art.expirationDate) : new Date();
  const diffMs = expiration.getTime() - creation.getTime();
  const durationHours = diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60)) : 24;

  const preview = art.preview || (assetDoc && assetDoc.url) || undefined;
  const scale = assetDoc && typeof assetDoc.scale === 'number' ? assetDoc.scale : 1.0;
  const rotation = assetDoc && typeof assetDoc.rotation === 'number' ? assetDoc.rotation : 0;
  const assetId = art.assetId ? art.assetId.toString() : (assetDoc && assetDoc._id ? assetDoc._id.toString() : undefined);

  return {
    id: art._id.toString(),
    title: art.title || '',
    artist: art.artist || '',
    description: art.description || '',
    locationName: art.locationName || '',
    latitude: art.latitude || 46.0697,
    longitude: art.longitude || 11.1211,
    hashtags: art.hashtags || [],
    likesCount: Array.isArray(art.likes) ? art.likes.length : 0,
    likedByUsernames: Array.isArray(art.likes) ? art.likes : [],
    comments: nestedComments,
    preview,
    assetId,
    scale,
    rotation,
    createdAt: art.createdAt || 'Qualche ora fa',
    durationHours,
    isExpired: expiration.getTime() < Date.now(),
    expirationDate: art.expirationDate ? new Date(art.expirationDate).toISOString() : undefined,
    license: art.license || 'Creative Commons BY 4.0',
    isSensitive: art.isSensitive || false,
    viewsCount: typeof art.viewsCount === 'number' ? art.viewsCount : (Array.isArray(art.likes) ? art.likes.length * 4 + 12 : 25),
    reportsCount: typeof art.reportsCount === 'number' ? art.reportsCount : 0,
  };
}

// Reconstruct nested comment replies from flat list
export function buildNestedComments(flatList: any[]) {
  const nested: any[] = [];
  const commentMap: Record<string, any> = {};

  flatList.forEach((c) => {
    commentMap[c.id] = { ...c, replies: [] };
  });

  flatList.forEach((c) => {
    const mapped = commentMap[c.id];
    if (c.parentId && commentMap[c.parentId]) {
      commentMap[c.parentId].replies.push(mapped);
    } else {
      nested.push(mapped);
    }
  });

  return nested;
}
