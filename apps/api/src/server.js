import express from 'express';
import {
  addProposalComment,
  buildBootstrap,
  connectDemoSession,
  createFork,
  createProposal,
  issueCitizenship,
  issueWalletChallenge,
  markAllActivitiesRead,
  readAuthenticatedSession,
  syncProposalLifecycles,
  verifyWalletSession,
  voteOnProposal,
} from '../../../packages/application/src/index.js';
import {
  appendAuditEntry,
  ensureStoreFile,
  ensureSessionSecret,
  listProtocolEventPolicies,
  loadAuditEntries,
  loadChainDeployment,
  loadProtocolStatus,
  loadStore,
  saveStore,
  syncProtocolStateForStore,
} from '../../../packages/infrastructure/src/index.js';
import { listProposalStateMachine, sameAddress } from '../../../packages/domain/src/index.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const app = express();

async function loadPreparedStore() {
  const store = await loadStore();
  const previousEventCount = store.events.length;
  return {
    store,
    previousEventCount,
    changed: syncProposalLifecycles(store),
  };
}

async function persistStoreMutation(store, {
  action,
  actorAddress = null,
  previousEventCount = null,
} = {}) {
  const nextEvents =
    previousEventCount === null
      ? []
      : store.events.slice(Math.max(Number(previousEventCount) || 0, 0));

  await saveStore(store);
  const protocol = await syncProtocolStateForStore(store, { newEvents: nextEvents });
  await appendAuditEntry(store, {
    action,
    actorAddress,
    newEvents: nextEvents,
    protocol,
  });

  return {
    newEvents: nextEvents,
    protocol,
  };
}

function unauthorized(message) {
  const error = new Error(message);
  error.statusCode = 401;
  throw error;
}

function getBearerToken(request) {
  const authorization = String(request.headers.authorization ?? '');
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
}

app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  next();
});

await ensureStoreFile();
const sessionSecret = await ensureSessionSecret();

try {
  const startupStore = await loadStore();
  await syncProtocolStateForStore(startupStore);
} catch (error) {
  console.warn('Falha ao sincronizar baseline protocolar na inicializacao:', error);
}

function readSessionFromRequest(request) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const session = readAuthenticatedSession(sessionSecret, token);
  if (!session) {
    unauthorized('Sua sessao assinada expirou ou e invalida. Conecte a carteira novamente.');
  }

  return session;
}

function requireAuthenticatedAddress(request, address) {
  const session = readSessionFromRequest(request);
  if (!session) {
    unauthorized('Assine sua sessao antes de enviar esta operacao.');
  }

  if (!sameAddress(session.address, address)) {
    unauthorized('A sessao autenticada nao corresponde a carteira enviada nesta operacao.');
  }

  return session;
}

app.get('/api/health', async (_request, response) => {
  const chainDeployment = await loadChainDeployment();
  response.json({
    ok: true,
    name: 'gitlaw-local-api',
    chainDeployed: Boolean(chainDeployment),
    walletAuth: true,
  });
});

app.get('/api/chain/deployment', async (_request, response, next) => {
  try {
    response.json({
      deployment: await loadChainDeployment(),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/proposals/state-machine', (_request, response) => {
  response.json({
    machine: listProposalStateMachine(),
  });
});

app.get('/api/bootstrap', async (request, response, next) => {
  try {
    const { store, changed, previousEventCount } = await loadPreparedStore();
    if (changed) {
      await persistStoreMutation(store, {
        action: 'proposal_lifecycle_sync',
        actorAddress: null,
        previousEventCount,
      });
    }
    const session = readSessionFromRequest(request);
    const address = session?.address ?? request.query.address ?? null;
    response.json(buildBootstrap(store, address, session ?? undefined));
  } catch (error) {
    next(error);
  }
});

app.post('/api/session/connect', async (request, response, next) => {
  try {
    const { store, changed, previousEventCount: syncEventCount } = await loadPreparedStore();
    if (changed) {
      await persistStoreMutation(store, {
        action: 'proposal_lifecycle_sync',
        actorAddress: null,
        previousEventCount: syncEventCount,
      });
    }
    if (!request.body?.demo) {
      const error = new Error('Use o fluxo de desafio e assinatura para conectar uma carteira real.');
      error.statusCode = 400;
      throw error;
    }

    const previousEventCount = store.events.length;
    const session = connectDemoSession(sessionSecret, store);
    await persistStoreMutation(store, {
      action: 'session_connect_demo',
      actorAddress: session.address,
      previousEventCount,
    });
    response.json(session);
  } catch (error) {
    next(error);
  }
});

app.post('/api/session/challenge', async (request, response, next) => {
  try {
    response.json(issueWalletChallenge(request.body ?? {}));
  } catch (error) {
    next(error);
  }
});

app.post('/api/session/verify', async (request, response, next) => {
  try {
    const { store, changed, previousEventCount: syncEventCount } = await loadPreparedStore();
    if (changed) {
      await persistStoreMutation(store, {
        action: 'proposal_lifecycle_sync',
        actorAddress: null,
        previousEventCount: syncEventCount,
      });
    }

    const previousEventCount = store.events.length;
    const session = verifyWalletSession(sessionSecret, store, request.body ?? {});
    await persistStoreMutation(store, {
      action: 'session_verify_wallet',
      actorAddress: session.address,
      previousEventCount,
    });
    response.json(session);
  } catch (error) {
    next(error);
  }
});

app.post('/api/citizenship/issue', async (request, response, next) => {
  try {
    requireAuthenticatedAddress(request, request.body?.address);
    const { store } = await loadPreparedStore();
    const previousEventCount = store.events.length;
    const result = issueCitizenship(store, request.body ?? {});
    await persistStoreMutation(store, {
      action: 'citizenship_issue',
      actorAddress: request.body?.address ?? null,
      previousEventCount,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals', async (request, response, next) => {
  try {
    requireAuthenticatedAddress(request, request.body?.authorAddress);
    const { store } = await loadPreparedStore();
    const previousEventCount = store.events.length;
    const result = createProposal(store, request.body ?? {});
    await persistStoreMutation(store, {
      action: 'proposal_create',
      actorAddress: request.body?.authorAddress ?? null,
      previousEventCount,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals/:id/votes', async (request, response, next) => {
  try {
    requireAuthenticatedAddress(request, request.body?.address);
    const { store } = await loadPreparedStore();
    const previousEventCount = store.events.length;
    const result = voteOnProposal(store, request.params.id, request.body ?? {});
    await persistStoreMutation(store, {
      action: 'proposal_vote',
      actorAddress: request.body?.address ?? null,
      previousEventCount,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals/:id/comments', async (request, response, next) => {
  try {
    requireAuthenticatedAddress(request, request.body?.authorAddress);
    const { store } = await loadPreparedStore();
    const previousEventCount = store.events.length;
    const result = addProposalComment(store, request.params.id, request.body ?? {});
    await persistStoreMutation(store, {
      action: 'proposal_comment',
      actorAddress: request.body?.authorAddress ?? null,
      previousEventCount,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/activities/mark-all-read', async (request, response, next) => {
  try {
    requireAuthenticatedAddress(request, request.body?.address);
    const { store } = await loadPreparedStore();
    const previousEventCount = store.events.length;
    const result = markAllActivitiesRead(store, request.body?.address);
    await persistStoreMutation(store, {
      action: 'activities_mark_read',
      actorAddress: request.body?.address ?? null,
      previousEventCount,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/forks', async (request, response, next) => {
  try {
    requireAuthenticatedAddress(request, request.body?.authorAddress);
    const { store } = await loadPreparedStore();
    const previousEventCount = store.events.length;
    const result = createFork(store, request.body ?? {});
    await persistStoreMutation(store, {
      action: 'fork_create',
      actorAddress: request.body?.authorAddress ?? null,
      previousEventCount,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/auditoria/eventos', async (request, response, next) => {
  try {
    const { store, changed } = await loadPreparedStore();
    if (changed) {
      await saveStore(store);
    }

    const address = request.query.address ? String(request.query.address) : null;
    const events = [...(store.events ?? [])]
      .filter((event) => (address ? sameAddress(event.actorAddress, address) : true))
      .sort((left, right) => {
        return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
      });

    response.json({ events });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auditoria/transacoes', async (request, response, next) => {
  try {
    const limit = Number(request.query.limit || 50);
    response.json({
      entries: await loadAuditEntries(limit),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/protocolo/status', async (_request, response, next) => {
  try {
    response.json({
      protocol: await loadProtocolStatus(),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/protocolo/politica', (_request, response) => {
  response.json({
    events: listProtocolEventPolicies(),
  });
});

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    error: error.message || 'Erro interno no servidor local do GitLaw.',
  });
});

app.listen(port, host, () => {
  console.log(`GitLaw API rodando em http://${host}:${port}`);
});
