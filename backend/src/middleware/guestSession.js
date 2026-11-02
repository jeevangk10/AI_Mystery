const crypto = require('node:crypto');

const COOKIE_NAME = 'amr_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function signSessionId(sessionId, secret) {
  return crypto.createHmac('sha256', secret).update(sessionId).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function serializeCookie(name, value, secure) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure ? '; Secure' : ''}`;
}

function createGuestSession({ secret, production = false, sessionIdFactory = () => crypto.randomBytes(32).toString('base64url') }) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('A session signing secret of at least 32 characters is required.');
  }

  return function guestSession(req, res, next) {
    const token = readCookie(req.headers.cookie, COOKIE_NAME);
    const [sessionId, signature, extra] = token?.split('.') || [];
    const validFormat = Boolean(sessionId && signature && !extra && /^[A-Za-z0-9_-]{40,}$/.test(sessionId));
    const validSignature = validFormat && safeEqual(signSessionId(sessionId, secret), signature);

    if (validSignature) {
      req.sessionId = sessionId;
      return next();
    }

    req.sessionId = sessionIdFactory();
    const newSignature = signSessionId(req.sessionId, secret);
    res.append('Set-Cookie', serializeCookie(COOKIE_NAME, `${req.sessionId}.${newSignature}`, production));
    return next();
  };
}

module.exports = { createGuestSession, COOKIE_NAME };
