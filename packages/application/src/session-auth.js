import crypto from 'node:crypto';
import { verifyMessage } from 'ethers';

import {
  findCitizen,
  findLatestRequest,
  must,
  nowIso,
  recordDomainEvent,
  sameAddress,
} from '../../domain/src/index.js';
import { DEMO_CITIZEN_ADDRESS } from '../../shared/src/constants.js';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const challengeRegistry = new Map();

function unauthorized(message) {
  const error = new Error(message);
  error.statusCode = 401;
  throw error;
}

function normalizeAddress(address) {
  const normalized = String(address ?? '').trim();
  must(normalized, 'Endereco de carteira obrigatorio.');
  must(/^0x[a-fA-F0-9]{40}$/.test(normalized), 'Informe um endereco de carteira valido.');
  return normalized;
}

function base64urlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64urlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createTokenSignature(secret, encodedPayload) {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function createSessionToken(secret, payload) {
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = createTokenSignature(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function hasValidSignature(secret, encodedPayload, signature) {
  const expectedSignature = createTokenSignature(secret, encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(String(signature ?? ''));

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function buildSessionResponse(store, { address, authMethod, sessionToken }) {
  return {
    address,
    citizen: findCitizen(store, address),
    pendingRequest: findLatestRequest(store, address),
    authenticated: true,
    authMethod,
    demo: authMethod === 'demo',
    sessionToken,
  };
}

export function issueWalletChallenge(input) {
  const address = normalizeAddress(input?.address);
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = nowIso();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
  const message = [
    'GitLaw - aprovacao de sessao',
    `Carteira: ${address}`,
    `Nonce: ${nonce}`,
    `Emitido em: ${issuedAt}`,
    `Expira em: ${expiresAt}`,
    'Escopo: iniciar uma sessao autenticada no ambiente alpha local.',
  ].join('\n');

  challengeRegistry.set(address.toLowerCase(), {
    address,
    nonce,
    message,
    expiresAt,
  });

  return {
    address,
    nonce,
    message,
    expiresAt,
  };
}

export function verifyWalletSession(secret, store, input) {
  const address = normalizeAddress(input?.address);
  const signature = must(String(input?.signature ?? '').trim(), 'Assinatura obrigatoria.');
  const challenge = challengeRegistry.get(address.toLowerCase());

  if (!challenge) {
    unauthorized('Solicite um novo desafio de assinatura antes de continuar.');
  }

  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    challengeRegistry.delete(address.toLowerCase());
    unauthorized('O desafio de assinatura expirou. Solicite outro e tente novamente.');
  }

  let recoveredAddress = '';

  try {
    recoveredAddress = verifyMessage(challenge.message, signature);
  } catch {
    unauthorized('Nao foi possivel validar a assinatura desta carteira.');
  }

  if (!sameAddress(recoveredAddress, address)) {
    unauthorized('A assinatura nao corresponde a carteira informada.');
  }

  challengeRegistry.delete(address.toLowerCase());

  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const sessionToken = createSessionToken(secret, {
    sub: address,
    authMethod: 'wallet',
    iat: issuedAt,
    exp: expiresAt,
  });

  recordDomainEvent(store, {
    type: 'SessionAuthenticated',
    actorAddress: address,
    entityType: 'sessao',
    entityId: address,
    payload: {
      authMethod: 'wallet',
    },
  });

  return buildSessionResponse(store, {
    address,
    authMethod: 'wallet',
    sessionToken,
  });
}

export function connectDemoSession(secret, store) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const sessionToken = createSessionToken(secret, {
    sub: DEMO_CITIZEN_ADDRESS,
    authMethod: 'demo',
    iat: issuedAt,
    exp: expiresAt,
  });

  recordDomainEvent(store, {
    type: 'SessionAuthenticated',
    actorAddress: DEMO_CITIZEN_ADDRESS,
    entityType: 'sessao',
    entityId: DEMO_CITIZEN_ADDRESS,
    payload: {
      authMethod: 'demo',
    },
  });

  return buildSessionResponse(store, {
    address: DEMO_CITIZEN_ADDRESS,
    authMethod: 'demo',
    sessionToken,
  });
}

export function readAuthenticatedSession(secret, token) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = String(token).split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!hasValidSignature(secret, encodedPayload, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (!payload?.sub || !payload?.authMethod || Number(payload?.exp ?? 0) < Date.now()) {
      return null;
    }

    return {
      address: String(payload.sub),
      authMethod: String(payload.authMethod),
      authenticated: true,
      demo: payload.authMethod === 'demo',
      expiresAt: new Date(Number(payload.exp)).toISOString(),
    };
  } catch {
    return null;
  }
}
