import jwt from 'jsonwebtoken';

const SUPER_SECRET =
  process.env.SUPER_SECRET ||
  process.env.AUTH_JWT_SECRET ||
  'dart_super_secret_unitn_2026';

export interface TokenPayload {
  username: string;
  email?: string;
  isModerator?: boolean;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Creates a signed JWT authentication token for a user (compliant with EasyLib & RFC 7519)
 * @param payload User identity information
 * @param expiresInSeconds Expiration duration in seconds (default: 86400s / 24h)
 */
export function createAuthToken(
  payload: { username: string; email?: string; isModerator?: boolean },
  expiresInSeconds: number = 86400
): string {
  return jwt.sign(payload, SUPER_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Verifies a signed JWT authentication token
 */
export function verifyAuthToken(token: string): {
  valid: boolean;
  user?: TokenPayload;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token non fornito o non valido' };
  }

  try {
    const decoded = jwt.verify(token, SUPER_SECRET) as TokenPayload;
    return { valid: true, user: decoded };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token has expired' };
    }
    return { valid: false, error: 'Invalid token signature' };
  }
}

/**
 * Middleware token checker helper (Compliant with EasyLib tokenChecker.js)
 * Checks:
 * 1. Authorization: Bearer <token>
 * 2. x-access-token header
 * 3. ?token=<token> URL query parameter
 */
export function authenticateRequest(request: Request): {
  authenticated: boolean;
  user?: TokenPayload;
  errorResponse?: Response;
} {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('Authorization');
  const xAccessToken =
    request.headers.get('x-access-token') || request.headers.get('X-Access-Token');

  let token: string | null = null;

  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      token = match[1].trim();
    }
  }

  if (!token && xAccessToken) {
    token = xAccessToken.trim();
  }

  if (!token) {
    try {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    } catch {
      // URL parsing fallback
    }
  }

  if (!token) {
    return {
      authenticated: false,
      errorResponse: Response.json(
        {
          success: false,
          error: 'Autenticazione richiesta. Nessun token fornito (No token provided).',
        },
        { status: 401 }
      ),
    };
  }

  const result = verifyAuthToken(token);
  if (!result.valid || !result.user) {
    return {
      authenticated: false,
      errorResponse: Response.json(
        {
          success: false,
          error: result.error || 'Autenticazione fallita. Token non valido o scaduto.',
        },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    user: result.user,
  };
}
