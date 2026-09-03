import { createAuthToken, verifyAuthToken, authenticateRequest } from '../src/lib/auth-tokens';

describe('Cryptographic Authentication & Token Verification (RFC 7519 / HMAC-SHA256)', () => {
  test('TC-AUTH-1: Genera un token JWT conforme a 3 segmenti (header.payload.signature)', () => {
    const token = createAuthToken({ username: 'davide_db', email: 'davide@unitn.it' });
    expect(typeof token).toBe('string');
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  test('TC-AUTH-2: Decodifica e verifica con successo un token valido', () => {
    const token = createAuthToken({
      username: 'SaraPixel',
      email: 'sara@pixel.art',
      isModerator: true,
    });
    const result = verifyAuthToken(token);

    expect(result.valid).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.username).toBe('SaraPixel');
    expect(result.user?.email).toBe('sara@pixel.art');
    expect(result.user?.isModerator).toBe(true);
  });

  test('TC-AUTH-3: Rileva e rifiuta token manomessi (firma contraffatta)', () => {
    const token = createAuthToken({ username: 'davide_db' });
    const [header, payload] = token.split('.');
    const forgedToken = `${header}.${payload}.firma_falsificata_1234567890`;

    const result = verifyAuthToken(forgedToken);
    expect(result.valid).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.error).toBe('Invalid token signature');
  });

  test('TC-AUTH-4: Rifiuta token scaduto', () => {
    // Expire immediately with negative duration (-1000ms)
    const expiredToken = createAuthToken({ username: 'davide_db' }, -1000);
    const result = verifyAuthToken(expiredToken);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token has expired');
  });

  test('TC-AUTH-5: Middleware authenticateRequest valida correttamente gli header HTTP', () => {
    const token = createAuthToken({ username: 'MatteoVR' });

    // Valid Header
    const validReq = new Request('http://localhost:8081/api/dartworks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authValid = authenticateRequest(validReq);
    expect(authValid.authenticated).toBe(true);
    expect(authValid.user?.username).toBe('MatteoVR');

    // Missing Header
    const missingReq = new Request('http://localhost:8081/api/dartworks');
    const authMissing = authenticateRequest(missingReq);
    expect(authMissing.authenticated).toBe(false);
    expect(authMissing.errorResponse?.status).toBe(401);

    // Support x-access-token header (EasyLib compatibility)
    const xAccessReq = new Request('http://localhost:8081/api/dartworks', {
      headers: { 'x-access-token': token },
    });
    const authXAccess = authenticateRequest(xAccessReq);
    expect(authXAccess.authenticated).toBe(true);
    expect(authXAccess.user?.username).toBe('MatteoVR');

    // Support query parameter token (EasyLib compatibility)
    const queryReq = new Request(`http://localhost:8081/api/dartworks?token=${token}`);
    const authQuery = authenticateRequest(queryReq);
    expect(authQuery.authenticated).toBe(true);
    expect(authQuery.user?.username).toBe('MatteoVR');
  });
});
