import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { Wallet } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const smokeRoot = path.join(projectRoot, '.tmp', `smoke-flow-${Date.now()}`);
const smokeDataDir = path.join(smokeRoot, 'data');
const smokeLogsDir = path.join(smokeRoot, 'logs');
const chainPort = 9545;
const apiPort = 3101;
const chainRpc = `http://127.0.0.1:${chainPort}`;
const apiBase = `http://127.0.0.1:${apiPort}`;

const hardhatNodeArgs = [
  './node_modules/hardhat/dist/src/cli.js',
  'node',
  '--hostname',
  '127.0.0.1',
  '--port',
  String(chainPort),
];

const hardhatDeployArgs = [
  './node_modules/hardhat/dist/src/cli.js',
  'run',
  'scripts/deploy-local.js',
  '--network',
  'localhost',
];

const smokeEnv = {
  ...process.env,
  GITLAW_CHAIN_RPC: chainRpc,
  GITLAW_DATA_DIR: path.relative(projectRoot, smokeDataDir),
  HARDHAT_DISABLE_TELEMETRY_PROMPT: 'true',
  CI: 'true',
};

const walletKeys = {
  newCitizen: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  conceicaoCitizen: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  centroCitizen: '0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82',
};

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(payload?.error || `${response.status} ${response.statusText}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function waitFor(check, { timeoutMs = 45000, intervalMs = 500, label = 'resource' } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await check();
    } catch {
      await wait(intervalMs);
    }
  }

  throw new Error(`Timeout aguardando ${label}.`);
}

function attachLogs(child, logFilePath) {
  const chunks = [];

  const append = async (source, buffer) => {
    const content = String(buffer);
    chunks.push(content);
    await fs.appendFile(logFilePath, `[${source}] ${content}`, 'utf8');
  };

  child.stdout?.on('data', (buffer) => {
    void append('stdout', buffer);
  });
  child.stderr?.on('data', (buffer) => {
    void append('stderr', buffer);
  });

  return () => chunks.join('');
}

function spawnProcess(command, args, { env, logFileName, label }) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logFilePath = path.join(smokeLogsDir, logFileName);
  const readLogs = attachLogs(child, logFilePath);

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${label}] saiu com codigo ${code}`);
    }
  });

  return {
    child,
    logFilePath,
    readLogs,
  };
}

async function stopProcess(handle) {
  if (!handle?.child || handle.child.exitCode !== null) {
    return;
  }

  const waitForExitCode = async (timeoutMs) => {
    const startedAt = Date.now();
    while (handle.child.exitCode === null && Date.now() - startedAt < timeoutMs) {
      await wait(100);
    }
    return handle.child.exitCode !== null;
  };

  handle.child.kill('SIGTERM');

  if (await waitForExitCode(2000)) {
    return;
  }

  handle.child.kill('SIGKILL');
  await waitForExitCode(2000);

  if (handle.child.exitCode === null && handle.child.pid) {
    try {
      process.kill(handle.child.pid, 'SIGKILL');
    } catch {
      // Ignore if the OS already reaped the child.
    }
  }
}

async function runCommand(command, args, { env, label, logFileName }) {
  const handle = spawnProcess(command, args, { env, label, logFileName });

  const exitCode = await new Promise((resolve, reject) => {
    handle.child.once('error', reject);
    handle.child.once('exit', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`${label} falhou. Veja ${handle.logFilePath}`);
  }

  return handle.readLogs();
}

async function jsonRpc(method, params = []) {
  return fetchJson(chainRpc, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
}

async function api(pathname, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetchJson(`${apiBase}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function authWallet(privateKey) {
  const wallet = new Wallet(privateKey);
  const challenge = await api('/api/session/challenge', {
    method: 'POST',
    body: { address: wallet.address },
  });
  const signature = await wallet.signMessage(challenge.message);
  const session = await api('/api/session/verify', {
    method: 'POST',
    body: {
      address: wallet.address,
      signature,
    },
  });

  return { wallet, session };
}

function summarizeProposal(proposal) {
  return {
    id: proposal.id,
    status: proposal.status,
    workflowStage: proposal.workflowStage,
    votes: proposal.votes.length,
    comments: proposal.comments.length,
    quorumRemaining: proposal.quorumRemaining,
  };
}

async function runSmokeFlow() {
  const anonymous = await api('/api/bootstrap');
  assert.equal(anonymous.session.authenticated, false);

  const demo = await api('/api/session/connect', {
    method: 'POST',
    body: { demo: true },
  });
  const demoToken = demo.sessionToken;

  const newCitizen = await authWallet(walletKeys.newCitizen);
  const beforeCitizenship = await api('/api/bootstrap', {
    token: newCitizen.session.sessionToken,
  });
  assert.equal(beforeCitizenship.session.citizen, null);

  await api('/api/citizenship/issue', {
    method: 'POST',
    token: newCitizen.session.sessionToken,
    body: {
      address: newCitizen.wallet.address,
      bairroId: 'corrego-feijao',
      documentName: 'comprovante-residencia.pdf',
      documentType: 'application/pdf',
      documentSize: 245760,
    },
  });

  const afterCitizenship = await api('/api/bootstrap', {
    token: newCitizen.session.sessionToken,
  });
  assert.equal(afterCitizenship.session.citizen?.bairroId, 'corrego-feijao');

  const proposalCreation = await api('/api/proposals', {
    method: 'POST',
    token: newCitizen.session.sessionToken,
    body: {
      authorAddress: newCitizen.wallet.address,
      lawId: 'lei-1',
      articleId: 'lei-1-art-1',
      title: 'Amplia transparência territorial das revisões do Plano Diretor',
      justification:
        'Padroniza a publicação periódica de revisões urbanas em linguagem simples, com foco específico em bairros sob pressão territorial.',
      newText:
        'O Poder Executivo publicará relatório trimestral, em linguagem simples e acesso aberto, com mapa por bairro das revisões e decisões urbanísticas relacionadas a este plano.',
      impactedNeighborhoodIds: ['corrego-feijao'],
      issueId: '#smoke-e2e-001',
      urgency: false,
    },
  });

  const proposalId = proposalCreation.proposal.id;

  await api(`/api/proposals/${proposalId}/comments`, {
    method: 'POST',
    token: demoToken,
    body: {
      authorAddress: demo.address,
      body: 'Comentário automático de smoke test para validar o fluxo institucional completo.',
    },
  });

  const conceicao = await authWallet(walletKeys.conceicaoCitizen);

  await api(`/api/proposals/${proposalId}/votes`, {
    method: 'POST',
    token: newCitizen.session.sessionToken,
    body: {
      address: newCitizen.wallet.address,
      choice: 'favor',
    },
  });

  await api(`/api/proposals/${proposalId}/votes`, {
    method: 'POST',
    token: demoToken,
    body: {
      address: demo.address,
      choice: 'favor',
    },
  });

  const approvedProposalVote = await api(`/api/proposals/${proposalId}/votes`, {
    method: 'POST',
    token: conceicao.session.sessionToken,
    body: {
      address: conceicao.wallet.address,
      choice: 'favor',
    },
  });

  assert.equal(approvedProposalVote.proposal.status, 'aprovado');

  const centro = await authWallet(walletKeys.centroCitizen);

  const variationProposal = await api('/api/proposals', {
    method: 'POST',
    token: demoToken,
    body: {
      authorAddress: demo.address,
      lawId: 'lei-3',
      kind: 'variacao_local',
      title: 'Autoriza variação local de recuperação ambiental no Sapé',
      justification:
        'Abre autorização territorial temporária para testar regras de recuperação ambiental adaptadas à realidade do bairro, com avaliação pública dos resultados.',
      variationDraft: {
        name: 'Protocolo Verde - Sapé',
        objective:
          'Permitir experimento territorial com regras operacionais de recuperação ambiental, registro público dos efeitos e revisão periódica dos resultados locais.',
        durationMonths: 8,
        slug: 'protocolo-verde-sape',
      },
      issueId: '#smoke-e2e-variacao-001',
    },
  });

  const variationProposalId = variationProposal.proposal.id;
  await assert.rejects(
    api('/api/forks', {
      method: 'POST',
      token: demoToken,
      body: {
        authorAddress: demo.address,
        sourceProposalId: variationProposalId,
      },
    }),
    /aprovada/,
  );

  await api(`/api/proposals/${variationProposalId}/votes`, {
    method: 'POST',
    token: demoToken,
    body: {
      address: demo.address,
      choice: 'favor',
    },
  });

  const approvedVariationVote = await api(`/api/proposals/${variationProposalId}/votes`, {
    method: 'POST',
    token: centro.session.sessionToken,
    body: {
      address: centro.wallet.address,
      choice: 'favor',
    },
  });

  assert.equal(approvedVariationVote.proposal.status, 'aprovado');

  const forkCreation = await api('/api/forks', {
    method: 'POST',
    token: demoToken,
    body: {
      authorAddress: demo.address,
      sourceProposalId: variationProposalId,
    },
  });

  const markRead = await api('/api/activities/mark-all-read', {
    method: 'POST',
    token: newCitizen.session.sessionToken,
    body: {
      address: newCitizen.wallet.address,
    },
  });
  assert.equal(markRead.ok, true);

  const protocol = await api('/api/protocolo/status');
  assert.equal(protocol.protocol.pending, 0);
  assert.equal(protocol.protocol.blocked, 0);
  assert.equal(protocol.protocol.failed, 0);
  assert.equal(protocol.protocol.skipped, 0);

  const events = await api(`/api/auditoria/eventos?address=${newCitizen.wallet.address}`);
  assert.ok(events.events.some((event) => event.type === 'CitizenIssued'));
  assert.ok(events.events.some((event) => event.type === 'ProposalApproved'));

  return {
    citizenAddress: newCitizen.wallet.address,
    proposal: summarizeProposal(approvedProposalVote.proposal),
    variationProposal: summarizeProposal(approvedVariationVote.proposal),
    fork: {
      id: forkCreation.fork.id,
      leiForkId: forkCreation.fork.leiForkId,
      sourceProposalId: forkCreation.fork.sourceProposalId,
    },
    protocol: {
      pending: protocol.protocol.pending,
      anchored: protocol.protocol.anchored,
      blocked: protocol.protocol.blocked,
      failed: protocol.protocol.failed,
      skipped: protocol.protocol.skipped,
    },
    artifacts: {
      dataDir: smokeDataDir,
      chainLog: path.join(smokeLogsDir, 'chain.log'),
      apiLog: path.join(smokeLogsDir, 'api.log'),
    },
  };
}

async function main() {
  await ensureDir(smokeDataDir);
  await ensureDir(smokeLogsDir);

  let chainHandle = null;
  let apiHandle = null;

  try {
    chainHandle = spawnProcess('node', hardhatNodeArgs, {
      env: smokeEnv,
      logFileName: 'chain.log',
      label: 'chain',
    });

    await waitFor(async () => {
      const response = await jsonRpc('eth_blockNumber');
      if (!response.result) {
        throw new Error('RPC ainda indisponivel.');
      }
      return response;
    }, { label: 'chain local' });

    await runCommand('./node_modules/node/bin/node', hardhatDeployArgs, {
      env: smokeEnv,
      label: 'deploy local',
      logFileName: 'deploy.log',
    });

    apiHandle = spawnProcess('node', ['apps/api/src/server.js'], {
      env: {
        ...smokeEnv,
        PORT: String(apiPort),
      },
      logFileName: 'api.log',
      label: 'api',
    });

    await waitFor(async () => {
      const health = await api('/api/health');
      if (!health.ok) {
        throw new Error('API indisponivel.');
      }
      return health;
    }, {
      timeoutMs: 90000,
      label: 'api local',
    });

    const summary = await runSmokeFlow();

    console.log(JSON.stringify({
      ok: true,
      name: 'gitlaw-smoke-flow',
      chainRpc,
      apiBase,
      summary,
    }, null, 2));
  } finally {
    await stopProcess(apiHandle);
    await stopProcess(chainHandle);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      message: error.message,
      stack: error.stack,
      smokeRoot,
    }, null, 2));
    process.exit(1);
  });
