// Mock MongoDB to isolate API controller logic and test real route handlers
jest.mock('../src/lib/mongodb', () => {
  const mockCollection = {
    insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-obj-id' }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    findOne: jest.fn().mockResolvedValue({
      _id: '6a3d4a23f2e0130577711201',
      likes: ['davide_db'],
    }),
    find: jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
      sort: jest.fn().mockReturnThis(),
    }),
  };
  return {
    connectToDatabase: jest.fn().mockResolvedValue({
      db: {
        collection: jest.fn().mockReturnValue(mockCollection),
      },
    }),
  };
});

import { POST as postDartwork } from '../src/app/api/dartworks+api';
import { POST as postReport } from '../src/app/api/reports+api';
import { DELETE as deleteReport } from '../src/app/api/reports/[targetId]+api';
import { POST as postComment } from '../src/app/api/comments+api';
import { DELETE as deleteComment } from '../src/app/api/comments/[id]+api';
import { POST as postLike } from '../src/app/api/dartworks/[id]/like+api';
import { createAuthToken } from '../src/lib/auth-tokens';

describe('Real REST Web APIs Controllers & Bearer Token Authentication', () => {
  const validToken = createAuthToken({ username: 'davide_db', email: 'davide@unitn.it' });
  const adminToken = createAuthToken({ username: 'admin_trento', isModerator: true });

  test('TC-API-AUTH-1: POST /api/dartworks - Rifiuta richiesta priva di header Authorization (HTTP 401)', async () => {
    const request = new Request('http://localhost:8081/api/dartworks', {
      method: 'POST',
      body: JSON.stringify({
        dArtWork: { title: 'Senza Token', locationName: 'Piazza Duomo' },
      }),
    });

    const response = await postDartwork(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toContain('Autenticazione richiesta');
  });

  test('TC-API-AUTH-2: POST /api/dartworks - Rifiuta richiesta con Token contraffatto o non valido (HTTP 401)', async () => {
    const request = new Request('http://localhost:8081/api/dartworks', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid.token.signature123',
      },
      body: JSON.stringify({
        dArtWork: { title: 'Con Token Falso' },
      }),
    });

    const response = await postDartwork(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('TC-API-AUTH-3: POST /api/dartworks - Rifiuta payload con campi obbligatori mancanti anche se autenticato (HTTP 400)', async () => {
    const request = new Request('http://localhost:8081/api/dartworks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        dArtWork: {
          description: 'Senza titolo',
          locationName: 'Piazza Duomo',
        },
      }),
    });

    const response = await postDartwork(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Title and artist are required');
  });

  test('TC-API-AUTH-4: POST /api/dartworks - Accetta pubblicazione con Token valido e assegna l autore autenticato (HTTP 201)', async () => {
    const request = new Request('http://localhost:8081/api/dartworks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        dArtWork: {
          title: 'Monumento AR Reale',
          description: 'Descrizione valida',
          locationName: 'Piazza Duomo',
          latitude: 46.0674,
          longitude: 11.1215,
          hashtags: ['3DArt'],
        },
      }),
    });

    const response = await postDartwork(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.insertedId).toBeDefined();
    expect(body.assetId).toBeDefined();
  });

  test('TC-API-AUTH-5: POST /api/comments - Rifiuta commento senza autenticazione (HTTP 401)', async () => {
    const request = new Request('http://localhost:8081/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        artworkId: '6a3d4a23f2e0130577711201',
        comment: { text: 'Commento anonimo' },
      }),
    });

    const response = await postComment(request);
    expect(response.status).toBe(401);
  });

  test('TC-API-AUTH-6: POST /api/comments - Accetta commento con Bearer Token valido (HTTP 201)', async () => {
    const request = new Request('http://localhost:8081/api/comments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        artworkId: '6a3d4a23f2e0130577711201',
        comment: { text: 'Ottima opera!' },
      }),
    });

    const response = await postComment(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeDefined();
  });

  test('TC-API-AUTH-7: POST /api/dartworks/like - Esegue toggle like solo per utente autenticato (HTTP 200)', async () => {
    const request = new Request('http://localhost:8081/api/dartworks/like', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        artworkId: '6a3d4a23f2e0130577711201',
      }),
    });

    const response = await postLike(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('TC-API-AUTH-8: POST /api/reports - Crea segnalazione con utente autenticato estratto dal token (HTTP 201)', async () => {
    const request = new Request('http://localhost:8081/api/reports', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        targetId: '6a3d4a23f2e0130577711201',
        targetType: 'artwork',
        category: 'offensive',
        reason: 'Segnalazione con token valido',
      }),
    });

    const response = await postReport(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeDefined();
  });

  test('TC-API-AUTH-9: DELETE /api/reports - Elimina segnalazione con autorizzazione (HTTP 200)', async () => {
    const request = new Request('http://localhost:8081/api/reports', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetId: '6a3d4a23f2e0130577711201',
      }),
    });

    const response = await deleteReport(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
