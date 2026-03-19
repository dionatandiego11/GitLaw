import express from 'express';
import {
  addProposalComment,
  buildBootstrap,
  connectSession,
  createFork,
  createProposal,
  issueCitizenship,
  markAllActivitiesRead,
  syncProposalLifecycles,
  voteOnProposal,
} from '../../../packages/application/src/index.js';
import {
  ensureStoreFile,
  loadChainDeployment,
  loadStore,
  saveStore,
} from '../../../packages/infrastructure/src/index.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const app = express();

async function loadPreparedStore() {
  const store = await loadStore();
  return {
    store,
    changed: syncProposalLifecycles(store),
  };
}

app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  next();
});

app.get('/api/health', async (_request, response) => {
  const chainDeployment = await loadChainDeployment();
  response.json({
    ok: true,
    name: 'gitlaw-local-api',
    chainDeployed: Boolean(chainDeployment),
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

app.get('/api/bootstrap', async (request, response, next) => {
  try {
    const { store, changed } = await loadPreparedStore();
    if (changed) {
      await saveStore(store);
    }
    response.json(buildBootstrap(store, request.query.address ?? null));
  } catch (error) {
    next(error);
  }
});

app.post('/api/session/connect', async (request, response, next) => {
  try {
    const { store, changed } = await loadPreparedStore();
    if (changed) {
      await saveStore(store);
    }
    response.json(connectSession(store, request.body ?? {}));
  } catch (error) {
    next(error);
  }
});

app.post('/api/citizenship/issue', async (request, response, next) => {
  try {
    const { store } = await loadPreparedStore();
    const result = issueCitizenship(store, request.body ?? {});
    await saveStore(store);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals', async (request, response, next) => {
  try {
    const { store } = await loadPreparedStore();
    const result = createProposal(store, request.body ?? {});
    await saveStore(store);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals/:id/votes', async (request, response, next) => {
  try {
    const { store } = await loadPreparedStore();
    const result = voteOnProposal(store, request.params.id, request.body ?? {});
    await saveStore(store);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals/:id/comments', async (request, response, next) => {
  try {
    const { store } = await loadPreparedStore();
    const result = addProposalComment(store, request.params.id, request.body ?? {});
    await saveStore(store);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/activities/mark-all-read', async (request, response, next) => {
  try {
    const { store } = await loadPreparedStore();
    const result = markAllActivitiesRead(store, request.body?.address);
    await saveStore(store);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/forks', async (request, response, next) => {
  try {
    const { store } = await loadPreparedStore();
    const result = createFork(store, request.body ?? {});
    await saveStore(store);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    error: error.message || 'Erro interno no servidor local do GitLaw.',
  });
});

await ensureStoreFile();

app.listen(port, host, () => {
  console.log(`GitLaw API rodando em http://${host}:${port}`);
});
