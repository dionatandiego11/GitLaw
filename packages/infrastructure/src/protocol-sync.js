import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { Contract, HDNodeWallet, JsonRpcProvider, ZeroHash, ethers } from 'ethers';

import { loadChainDeployment } from './json-store.js';
import { dataDir } from './paths.js';
import { getProtocolEventPolicy } from './protocol-event-policy.js';

const protocolStatePath = path.join(dataDir, 'protocol-state.json');

const DEFAULT_LOCAL_CHAIN_RPC = 'http://127.0.0.1:8545';
const DEFAULT_HARDHAT_MNEMONIC = 'test test test test test test test test test test test junk';

const citizenshipAbi = [
  'function mintCitizen(address citizen, bytes32 bairroId, uint256 nivel) returns (uint256)',
  'function isCitizenActive(address citizen) view returns (bool)',
  'function bairroOf(address citizen) view returns (bytes32)',
];

const repositoryAbi = [
  'function registerLaw(bytes32 lawId, string numero, string titulo, string categoria, string versaoInicial, string contentHash, bytes32 baseLawId, bytes32 neighborhoodId, bool isFork)',
  'function recordCommit(bytes32 commitId, bytes32 lawId, bytes32 proposalId, string version, string message, string contentHash, address author)',
  'function lawExists(bytes32 lawId) view returns (bool)',
  'function getCommit(bytes32 commitId) view returns (tuple(bytes32 id, bytes32 lawId, bytes32 proposalId, string version, string message, string contentHash, address author, uint64 createdAt))',
];

const votingAbi = [
  'function createProposal(bytes32 proposalId, bytes32 lawId, bytes32 proposerNeighborhoodId, bytes32[] impactedNeighborhoodIds, bytes32[] adjacentNeighborhoodIds, uint64 votingEndsAt, uint256 quorum, uint8 kind)',
  'function castVote(bytes32 proposalId, uint8 choice)',
  'function finalizeProposal(bytes32 proposalId) returns (bool approved)',
  'function getProposal(bytes32 proposalId) view returns (tuple(bytes32 id, bytes32 lawId, bytes32 proposerNeighborhoodId, address proposer, uint8 kind, uint64 createdAt, uint64 votingEndsAt, uint256 quorum, uint256 favor, uint256 contra, uint256 abster, bool finalized, bool approved, bool exists, bytes32[] impactedNeighborhoodIds, bytes32[] adjacentNeighborhoodIds))',
  'function getVote(bytes32 proposalId, address voter) view returns (tuple(uint8 choice, uint256 weight, bytes32 neighborhoodId, bool exists))',
  'function getForkEligibility(bytes32 proposalId, bytes32 neighborhoodId) view returns (bool eligible, bytes32 lawId)',
];

const forksAbi = [
  'function createFork(bytes32 forkId, bytes32 proposalId, bytes32 neighborhoodId, bytes32 forkLawId, string slug, string objectiveHash)',
  'function getForkIdByProposal(bytes32 proposalId) view returns (bytes32)',
];

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function idHash(prefix, value) {
  return ethers.id(`${prefix}:${value}`);
}

function normalizeHexAddress(address) {
  const normalized = String(address ?? '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
    return null;
  }

  return ethers.getAddress(normalized.toLowerCase());
}

function textBytes32(value) {
  const normalized = String(value ?? '');
  const bytes = ethers.toUtf8Bytes(normalized);
  return bytes.length <= 31 ? ethers.encodeBytes32String(normalized) : ethers.id(`text:${normalized}`);
}

function contentHash(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function safeJsonStringify(value) {
  return JSON.stringify(value, (_key, item) => {
    return typeof item === 'bigint' ? item.toString() : item;
  });
}

function buildLawContentHash(law) {
  return contentHash(
    safeJsonStringify({
      titulo: law.titulo,
      numero: law.numero,
      versao: law.versao,
      artigos: law.artigos.map((article) => ({
        id: article.id,
        rotulo: article.rotulo,
        texto: article.texto,
      })),
    }),
  );
}

function buildCommitContentHash(commit) {
  return contentHash(
    safeJsonStringify({
      leiId: commit.leiId,
      prId: commit.prId ?? null,
      versao: commit.versao,
      resumo: commit.resumo,
      articleChanges: commit.articleChanges,
    }),
  );
}

function createTaskKey(taskType, suffix) {
  return `${taskType}:${suffix}`;
}

function createTask(taskType, key, actorAddress, entityId, payload, createdAt) {
  return {
    id: crypto.randomUUID(),
    key,
    taskType,
    actorAddress,
    entityId,
    payload,
    status: 'pending',
    createdAt: createdAt ?? nowIso(),
    updatedAt: createdAt ?? nowIso(),
    attempts: 0,
    txHash: null,
    contract: null,
    message: null,
  };
}

function addTaskIfMissing(state, task) {
  if (state.tasks.some((existing) => existing.key === task.key)) {
    return;
  }

  state.tasks.push(task);
}

function buildProposalKind(proposal) {
  return proposal.kind === 'variacao_local' ? 1 : 0;
}

function buildVoteChoice(choice) {
  switch (choice) {
    case 'favor':
      return 1;
    case 'contra':
      return 2;
    case 'abster':
      return 3;
    default:
      return 0;
  }
}

function quorumToProtocolWeight(quorum) {
  return BigInt(Math.round(Number(quorum) * 100));
}

function toUnixTimestamp(isoDate) {
  return Math.floor(new Date(isoDate).getTime() / 1000);
}

export function replayVotingEndsAt(
  proposal,
  { chainTimestamp = Math.floor(Date.now() / 1000), wallClockTimestamp = Math.floor(Date.now() / 1000) } = {},
) {
  const minimumReplayWindowSeconds = 120;
  const voteReplayBufferSeconds = Math.max((proposal?.votes?.length ?? 0) * 30, minimumReplayWindowSeconds);
  const localDeadline = toUnixTimestamp(proposal.votingEndsAt);
  const safeLocalDeadline = Number.isFinite(localDeadline) ? localDeadline : wallClockTimestamp;
  const remainingWindowSeconds = Math.max(safeLocalDeadline - wallClockTimestamp, 0);
  const replayWindowSeconds = proposalNeedsFinalization(proposal)
    ? voteReplayBufferSeconds
    : Math.max(remainingWindowSeconds, voteReplayBufferSeconds);

  return Math.max(chainTimestamp + replayWindowSeconds, chainTimestamp + 2);
}

async function readLatestBlockTimestamp(context) {
  const latestBlock = await context.provider.send('eth_getBlockByNumber', ['latest', false]);
  return Number.parseInt(String(latestBlock?.timestamp ?? '0x0'), 16);
}

function proposalNeedsFinalization(proposal) {
  return proposal.status === 'aprovado' || proposal.status === 'rejeitado';
}

function buildAdjacentNeighborhoodIds(store, proposal) {
  const adjacentIds = new Set();

  for (const impactedId of proposal.impactedNeighborhoodIds) {
    const neighborhood = store.neighborhoods.find((item) => item.id === impactedId);
    for (const adjacentId of neighborhood?.adjacentes ?? []) {
      if (!proposal.impactedNeighborhoodIds.includes(adjacentId)) {
        adjacentIds.add(adjacentId);
      }
    }
  }

  return [...adjacentIds];
}

function buildBaselineTasks(store) {
  const tasks = [];

  for (const citizen of store.citizens ?? []) {
    if (!citizen.ativo) {
      continue;
    }

    tasks.push(
      createTask(
        'citizen_mint',
        createTaskKey('citizen_mint', citizen.address.toLowerCase()),
        citizen.address,
        citizen.address,
        {
          address: citizen.address,
          bairroId: citizen.bairroId,
          nivel: citizen.nivel,
        },
        citizen.emitidoEm,
      ),
    );
  }

  for (const proposal of store.proposals ?? []) {
    tasks.push(
      createTask(
        'proposal_create',
        createTaskKey('proposal_create', proposal.id),
        proposal.autor,
        proposal.id,
        {
          proposalId: proposal.id,
        },
        proposal.criadoEm,
      ),
    );

    for (const vote of proposal.votes ?? []) {
      tasks.push(
        createTask(
          'proposal_vote',
          createTaskKey('proposal_vote', `${proposal.id}:${vote.address.toLowerCase()}`),
          vote.address,
          proposal.id,
          {
            proposalId: proposal.id,
            voterAddress: vote.address,
          },
          vote.createdAt,
        ),
      );
    }

    if (proposalNeedsFinalization(proposal)) {
      tasks.push(
        createTask(
          'proposal_finalize',
          createTaskKey('proposal_finalize', proposal.id),
          proposal.autor,
          proposal.id,
          {
            proposalId: proposal.id,
          },
          proposal.closedAt ?? proposal.votingEndsAt ?? proposal.criadoEm,
        ),
      );
    }
  }

  for (const commit of store.commits ?? []) {
    tasks.push(
      createTask(
        'law_commit',
        createTaskKey('law_commit', commit.id),
        commit.autor,
        commit.id,
        {
          commitId: commit.id,
        },
        commit.timestamp,
      ),
    );
  }

  for (const fork of store.forks ?? []) {
    tasks.push(
      createTask(
        'fork_open',
        createTaskKey('fork_open', fork.id),
        fork.autor,
        fork.id,
        {
          forkId: fork.id,
        },
        fork.criadoEm,
      ),
    );
  }

  return tasks.sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function buildTasksFromEvents(events) {
  const tasks = [];

  for (const event of events) {
    const policy = getProtocolEventPolicy(event.type);
    if (!policy || policy.executionLayer !== 'on-chain' || !policy.taskType) {
      continue;
    }

    switch (policy.taskType) {
      case 'citizen_mint':
        tasks.push(
          createTask(
            policy.taskType,
            createTaskKey(policy.taskType, String(event.entityId).toLowerCase()),
            event.actorAddress,
            event.entityId,
            {
              address: event.entityId,
              bairroId: event.payload.bairroId,
              nivel: event.payload.nivel ?? 1,
            },
            event.occurredAt,
          ),
        );
        break;
      case 'proposal_create':
        tasks.push(
          createTask(
            policy.taskType,
            createTaskKey(policy.taskType, event.entityId),
            event.actorAddress,
            event.entityId,
            {
              proposalId: event.entityId,
            },
            event.occurredAt,
          ),
        );
        break;
      case 'proposal_vote':
        tasks.push(
          createTask(
            policy.taskType,
            createTaskKey(policy.taskType, `${event.entityId}:${String(event.actorAddress).toLowerCase()}`),
            event.actorAddress,
            event.entityId,
            {
              proposalId: event.entityId,
              voterAddress: event.actorAddress,
            },
            event.occurredAt,
          ),
        );
        break;
      case 'proposal_finalize':
        tasks.push(
          createTask(
            policy.taskType,
            createTaskKey(policy.taskType, event.entityId),
            event.actorAddress,
            event.entityId,
            {
              proposalId: event.entityId,
            },
            event.occurredAt,
          ),
        );
        break;
      case 'law_commit':
        tasks.push(
          createTask(
            policy.taskType,
            createTaskKey(policy.taskType, String(event.payload.commitId ?? event.entityId)),
            event.actorAddress,
            String(event.payload.commitId ?? event.entityId),
            {
              commitId: String(event.payload.commitId ?? event.entityId),
            },
            event.occurredAt,
          ),
        );
        break;
      case 'fork_open':
        tasks.push(
          createTask(
            policy.taskType,
            createTaskKey(policy.taskType, event.entityId),
            event.actorAddress,
            event.entityId,
            {
              forkId: event.entityId,
            },
            event.occurredAt,
          ),
        );
        break;
      default:
        break;
    }
  }

  return tasks;
}

async function ensureProtocolStateFile() {
  await fs.mkdir(dataDir, { recursive: true });

  if (!(await fileExists(protocolStatePath))) {
    await fs.writeFile(
      protocolStatePath,
      `${JSON.stringify({
        version: 1,
        baselinedAt: null,
        lastSyncAt: null,
        tasks: [],
      }, null, 2)}\n`,
      'utf8',
    );
  }
}

async function loadProtocolState() {
  await ensureProtocolStateFile();
  const raw = await fs.readFile(protocolStatePath, 'utf8');
  const parsed = JSON.parse(raw);

  return {
    version: parsed.version ?? 1,
    baselinedAt: parsed.baselinedAt ?? null,
    lastSyncAt: parsed.lastSyncAt ?? null,
    tasks: parsed.tasks ?? [],
  };
}

async function saveProtocolState(state) {
  await fs.mkdir(dataDir, { recursive: true });
  const tempPath = `${protocolStatePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, protocolStatePath);
}

async function createProtocolContext() {
  const deployment = await loadChainDeployment();
  if (!deployment?.contracts) {
    return null;
  }

  const provider = new JsonRpcProvider(process.env.GITLAW_CHAIN_RPC ?? DEFAULT_LOCAL_CHAIN_RPC);
  const ownerSigner = process.env.GITLAW_CHAIN_OWNER_PRIVATE_KEY
    ? new ethers.Wallet(process.env.GITLAW_CHAIN_OWNER_PRIVATE_KEY, provider)
    : HDNodeWallet.fromPhrase(
        process.env.GITLAW_CHAIN_MNEMONIC ?? DEFAULT_HARDHAT_MNEMONIC,
        undefined,
        "m/44'/60'/0'/0/0",
      ).connect(provider);

  const signerCache = new Map();

  const context = {
    provider,
    ownerSigner,
    signerCache,
    deployment,
    citizenship: new Contract(deployment.contracts.cidadaniaToken, citizenshipAbi, ownerSigner),
    repository: new Contract(deployment.contracts.gitLawRepository, repositoryAbi, ownerSigner),
    voting: new Contract(deployment.contracts.weightedVoting, votingAbi, ownerSigner),
    forks: new Contract(deployment.contracts.neighborhoodForks, forksAbi, ownerSigner),
  };

  return context;
}

function resolveLocalSigner(context, address) {
  const normalizedAddress = normalizeHexAddress(address)?.toLowerCase();
  if (!normalizedAddress) {
    return null;
  }
  if (context.signerCache.has(normalizedAddress)) {
    return context.signerCache.get(normalizedAddress);
  }

  const mnemonic = process.env.GITLAW_CHAIN_MNEMONIC ?? DEFAULT_HARDHAT_MNEMONIC;
  for (let index = 0; index < 25; index += 1) {
    const signer = HDNodeWallet.fromPhrase(
      mnemonic,
      undefined,
      `m/44'/60'/0'/0/${index}`,
    ).connect(context.provider);

    if (signer.address.toLowerCase() === normalizedAddress) {
      context.signerCache.set(normalizedAddress, signer);
      return signer;
    }
  }

  context.signerCache.set(normalizedAddress, null);
  return null;
}

async function ensureCitizenOnChain(context, citizen) {
  const citizenAddress = normalizeHexAddress(citizen.address);
  if (!citizenAddress) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Endereco da cidadania local nao e um address EVM valido para ancoragem.',
    };
  }

  const active = await context.citizenship.isCitizenActive(citizenAddress);
  if (active) {
    return {
      ok: true,
      status: 'anchored',
      message: 'Cidadania ja ativa na camada on-chain.',
    };
  }

  const tx = await context.citizenship.mintCitizen(
    citizenAddress,
    textBytes32(citizen.bairroId),
    BigInt(citizen.nivel ?? 1),
  );
  const receipt = await tx.wait();

  return {
    ok: true,
    status: 'anchored',
    txHash: receipt?.hash ?? tx.hash,
    contract: 'CidadaniaToken',
    message: 'Cidadania territorial ancorada on-chain.',
  };
}

async function ensureLawOnChain(context, law) {
  const lawId = idHash('law', law.id);
  const exists = await context.repository.lawExists(lawId);
  if (exists) {
    return {
      lawId,
      alreadyExists: true,
    };
  }

  const tx = await context.repository.registerLaw(
    lawId,
    String(law.numero ?? ''),
    String(law.titulo ?? ''),
    String(law.categoria ?? ''),
    String(law.versao ?? '1.0.0'),
    buildLawContentHash(law),
    law.leiOrigemId ? idHash('law', law.leiOrigemId) : ZeroHash,
    law.bairroId ? textBytes32(law.bairroId) : ZeroHash,
    Boolean(law.isFork),
  );
  const receipt = await tx.wait();

  return {
    lawId,
    alreadyExists: false,
    txHash: receipt?.hash ?? tx.hash,
  };
}

async function anchorCitizenTask(context, task) {
  return ensureCitizenOnChain(context, task.payload);
}

async function anchorProposalTask(context, store, task) {
  const proposal = store.proposals.find((item) => item.id === task.payload.proposalId);
  if (!proposal) {
    return {
      ok: false,
      status: 'skipped',
      message: 'A proposta local nao existe mais no snapshot atual.',
    };
  }

  const signer = resolveLocalSigner(context, proposal.autor);
  if (!signer) {
    return {
      ok: false,
      status: 'blocked',
      message: 'A proposta exige o signer local da carteira autora para ancoragem on-chain.',
    };
  }

  const onChainProposalId = idHash('proposal', proposal.id);
  try {
    const existing = await context.voting.getProposal(onChainProposalId);
    if (existing?.exists) {
      return {
        ok: true,
        status: 'anchored',
        contract: 'WeightedVoting',
        message: 'Proposta ja existe na camada on-chain.',
      };
    }
  } catch {
    // Proposal not found yet.
  }

  const citizen = store.citizens.find((item) => item.address.toLowerCase() === proposal.autor.toLowerCase());
  if (citizen) {
    const citizenResult = await ensureCitizenOnChain(context, citizen);
    if (!citizenResult.ok) {
      return citizenResult;
    }
  }

  const tx = await context.voting.connect(signer).createProposal(
    onChainProposalId,
    idHash('law', proposal.leiAlvoId),
    textBytes32(proposal.bairroId),
    proposal.impactedNeighborhoodIds.map((item) => textBytes32(item)),
    buildAdjacentNeighborhoodIds(store, proposal).map((item) => textBytes32(item)),
    BigInt(
      replayVotingEndsAt(proposal, {
        chainTimestamp: await readLatestBlockTimestamp(context),
      }),
    ),
    quorumToProtocolWeight(proposal.quorum),
    buildProposalKind(proposal),
  );
  const receipt = await tx.wait();

  return {
    ok: true,
    status: 'anchored',
    txHash: receipt?.hash ?? tx.hash,
    contract: 'WeightedVoting',
    message: 'Proposta ancorada na votacao verificavel.',
  };
}

async function anchorVoteTask(context, store, task) {
  const proposal = store.proposals.find((item) => item.id === task.payload.proposalId);
  if (!proposal) {
    return {
      ok: false,
      status: 'skipped',
      message: 'A proposta do voto nao existe mais no snapshot atual.',
    };
  }

  const vote = proposal.votes.find(
    (item) => item.address.toLowerCase() === String(task.payload.voterAddress).toLowerCase(),
  );
  if (!vote) {
    return {
      ok: false,
      status: 'skipped',
      message: 'O voto local nao existe mais no snapshot atual.',
    };
  }

  const signer = resolveLocalSigner(context, vote.address);
  if (!signer) {
    return {
      ok: false,
      status: 'blocked',
      message: 'O voto exige o signer local da carteira votante para ancoragem on-chain.',
    };
  }

  const onChainProposalId = idHash('proposal', proposal.id);
  let onChainProposal;
  try {
    onChainProposal = await context.voting.getProposal(onChainProposalId);
  } catch {
    return {
      ok: false,
      status: 'blocked',
      message: 'A proposta ainda nao foi ancorada na camada de votacao.',
    };
  }

  if (onChainProposal.finalized || Number(onChainProposal.votingEndsAt) <= Math.floor(Date.now() / 1000)) {
    return {
      ok: false,
      status: 'skipped',
      message: 'A proposta on-chain ja encerrou a janela de voto para esta ancoragem.',
    };
  }

  const voteAddress = normalizeHexAddress(vote.address);
  if (!voteAddress) {
    return {
      ok: false,
      status: 'blocked',
      message: 'O voto local usa uma carteira invalida para a camada EVM.',
    };
  }

  const existingVote = await context.voting.getVote(onChainProposalId, voteAddress);
  if (existingVote?.exists) {
    return {
      ok: true,
      status: 'anchored',
      contract: 'WeightedVoting',
      message: 'Voto ja registrado na camada on-chain.',
    };
  }

  const citizen = store.citizens.find((item) => item.address.toLowerCase() === vote.address.toLowerCase());
  if (citizen) {
    const citizenResult = await ensureCitizenOnChain(context, citizen);
    if (!citizenResult.ok) {
      return citizenResult;
    }
  }

  const tx = await context.voting.connect(signer).castVote(
    onChainProposalId,
    buildVoteChoice(vote.choice),
  );
  const receipt = await tx.wait();

  return {
    ok: true,
    status: 'anchored',
    txHash: receipt?.hash ?? tx.hash,
    contract: 'WeightedVoting',
    message: 'Voto ancorado na camada verificavel.',
  };
}

async function anchorCommitTask(context, store, task) {
  const commit = store.commits.find((item) => item.id === task.payload.commitId);
  if (!commit) {
    return {
      ok: false,
      status: 'skipped',
      message: 'O commit legislativo nao existe mais no snapshot atual.',
    };
  }

  try {
    await context.repository.getCommit(idHash('commit', commit.id));
    return {
      ok: true,
      status: 'anchored',
      contract: 'GitLawRepository',
      message: 'Commit legislativo ja registrado na camada on-chain.',
    };
  } catch {
    // Commit not found, continue.
  }

  const law = store.laws.find((item) => item.id === commit.leiId);
  if (!law) {
    return {
      ok: false,
      status: 'skipped',
      message: 'A lei alvo do commit nao existe mais no snapshot atual.',
    };
  }

  const lawResult = await ensureLawOnChain(context, law);
  const author = normalizeHexAddress(commit.autor) ?? context.ownerSigner.address;
  const tx = await context.repository.recordCommit(
    idHash('commit', commit.id),
    lawResult.lawId,
    commit.prId ? idHash('proposal', commit.prId) : ZeroHash,
    String(commit.versao ?? law.versao ?? '1.0.0'),
    String(commit.mensagem ?? 'Registro legislativo'),
    buildCommitContentHash(commit),
    author,
  );
  const receipt = await tx.wait();

  return {
    ok: true,
    status: 'anchored',
    txHash: receipt?.hash ?? tx.hash,
    contract: 'GitLawRepository',
    message: lawResult.alreadyExists
      ? 'Commit legislativo ancorado no repositório normativo.'
      : 'Lei registrada e commit legislativo ancorado no repositório normativo.',
  };
}

async function anchorFinalizeTask(context, store, state, task) {
  const proposal = store.proposals.find((item) => item.id === task.payload.proposalId);
  if (!proposal) {
    return {
      ok: false,
      status: 'skipped',
      message: 'A proposta a ser finalizada nao existe mais no snapshot atual.',
    };
  }

  const onChainProposalId = idHash('proposal', proposal.id);
  let onChainProposal;
  try {
    onChainProposal = await context.voting.getProposal(onChainProposalId);
  } catch {
    return {
      ok: false,
      status: 'blocked',
      message: 'A proposta ainda nao foi ancorada na camada de votacao.',
    };
  }

  const expectedApproved = proposal.status === 'aprovado';
  if (onChainProposal.finalized) {
    if (Boolean(onChainProposal.approved) !== expectedApproved) {
      return {
        ok: false,
        status: 'skipped',
        message:
          'O desfecho on-chain desta proposta divergiu do snapshot institucional e exige replay completo ou reset da camada local.',
      };
    }

    return {
      ok: true,
      status: 'anchored',
      contract: 'WeightedVoting',
      message: 'Resultado da proposta ja finalizado na camada verificavel.',
    };
  }

  const pendingVoteTask = state.tasks.find((candidate) => {
    return (
      candidate.taskType === 'proposal_vote' &&
      candidate.entityId === proposal.id &&
      !['anchored', 'skipped'].includes(candidate.status)
    );
  });

  if (pendingVoteTask) {
    return {
      ok: false,
      status: 'blocked',
      message: 'A finalizacao aguarda a ancoragem de todos os votos locais desta proposta.',
    };
  }

  const votingEndsAt = Number(onChainProposal.votingEndsAt);
  let latestTimestamp = await readLatestBlockTimestamp(context);

  if (latestTimestamp <= votingEndsAt) {
    try {
      await context.provider.send('evm_setNextBlockTimestamp', [votingEndsAt + 1]);
      await context.provider.send('evm_mine', []);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('lower than the previous block')) {
        throw error;
      }
    }

    latestTimestamp = await readLatestBlockTimestamp(context);

    if (latestTimestamp <= votingEndsAt) {
      const waitSeconds = Math.min(Math.max(votingEndsAt - latestTimestamp + 1, 1), 3);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      await context.provider.send('evm_mine', []);
    }
  }

  const tx = await context.voting.finalizeProposal(onChainProposalId, {
    gasLimit: 500000n,
  });
  const receipt = await tx.wait();
  const finalizedProposal = await context.voting.getProposal(onChainProposalId);

  if (Boolean(finalizedProposal.approved) !== expectedApproved) {
    return {
      ok: false,
      status: 'skipped',
      txHash: receipt?.hash ?? tx.hash,
      contract: 'WeightedVoting',
      message:
        'A finalizacao on-chain concluiu com resultado diferente do snapshot institucional e foi marcada como divergencia historica.',
    };
  }

  return {
    ok: true,
    status: 'anchored',
    txHash: receipt?.hash ?? tx.hash,
    contract: 'WeightedVoting',
    message: 'Resultado da proposta finalizado na camada verificavel.',
  };
}

async function anchorForkTask(context, store, task) {
  const fork = store.forks.find((item) => item.id === task.payload.forkId);
  if (!fork) {
    return {
      ok: false,
      status: 'skipped',
      message: 'A variacao territorial nao existe mais no snapshot atual.',
    };
  }

  if (!fork.sourceProposalId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'A variacao territorial ainda nao referencia uma proposta institucional de autorizacao.',
    };
  }

  const sourceProposal = store.proposals.find((item) => item.id === fork.sourceProposalId);
  if (!sourceProposal) {
    return {
      ok: false,
      status: 'blocked',
      message: 'A proposta de autorizacao da variacao nao existe mais no snapshot atual.',
    };
  }

  if (sourceProposal.kind !== 'variacao_local' || sourceProposal.status !== 'aprovado') {
    return {
      ok: false,
      status: 'blocked',
      message:
        'A variacao territorial depende de uma proposta de autorizacao aprovada e finalizada.',
    };
  }

  const onChainProposalId = idHash('proposal', sourceProposal.id);
  const existingForkId = await context.forks.getForkIdByProposal(onChainProposalId);
  if (existingForkId !== ZeroHash) {
    return {
      ok: true,
      status: 'anchored',
      contract: 'NeighborhoodForks',
      message: 'Variacao territorial ja registrada na camada on-chain.',
    };
  }

  const signer = resolveLocalSigner(context, fork.autor);
  if (!signer) {
    return {
      ok: false,
      status: 'blocked',
      message: 'A variacao territorial exige o signer local da carteira autora.',
    };
  }

  const citizen = store.citizens.find((item) => item.address.toLowerCase() === fork.autor.toLowerCase());
  if (citizen) {
    const citizenResult = await ensureCitizenOnChain(context, citizen);
    if (!citizenResult.ok) {
      return citizenResult;
    }
  }

  const [eligible] = await context.voting.getForkEligibility(
    onChainProposalId,
    textBytes32(fork.bairroId),
  );
  if (!eligible) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'A proposta on-chain ainda nao foi finalizada como autorizacao valida para abrir a variacao.',
    };
  }

  const tx = await context.forks.connect(signer).createFork(
    idHash('fork', fork.id),
    onChainProposalId,
    textBytes32(fork.bairroId),
    idHash('law', fork.leiForkId),
    String(fork.slug ?? ''),
    contentHash(fork.objetivo ?? fork.nome ?? fork.id),
  );
  const receipt = await tx.wait();

  return {
    ok: true,
    status: 'anchored',
    txHash: receipt?.hash ?? tx.hash,
    contract: 'NeighborhoodForks',
    message: 'Variacao territorial registrada na camada on-chain.',
  };
}

async function processTask(context, store, state, task) {
  switch (task.taskType) {
    case 'citizen_mint':
      return anchorCitizenTask(context, task);
    case 'proposal_create':
      return anchorProposalTask(context, store, task);
    case 'proposal_vote':
      return anchorVoteTask(context, store, task);
    case 'proposal_finalize':
      return anchorFinalizeTask(context, store, state, task);
    case 'law_commit':
      return anchorCommitTask(context, store, task);
    case 'fork_open':
      return anchorForkTask(context, store, task);
    default:
      return {
        ok: false,
        status: 'failed',
        message: 'Tipo de tarefa protocolar nao reconhecido.',
      };
  }
}

function summarizeProtocolState(state) {
  const counts = {
    pending: 0,
    anchored: 0,
    blocked: 0,
    failed: 0,
    skipped: 0,
  };

  for (const task of state.tasks) {
    if (task.status in counts) {
      counts[task.status] += 1;
    }
  }

  return {
    ...counts,
    lastSyncAt: state.lastSyncAt,
    baselinedAt: state.baselinedAt,
    recentTaskIds: [...state.tasks]
      .sort((left, right) => {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      })
      .slice(0, 8)
      .map((task) => task.id),
  };
}

export async function syncProtocolStateForStore(store, { newEvents = [] } = {}) {
  const state = await loadProtocolState();

  for (const task of buildBaselineTasks(store)) {
    addTaskIfMissing(state, task);
  }

  if (!state.baselinedAt) {
    state.baselinedAt = nowIso();
  }

  for (const task of buildTasksFromEvents(newEvents)) {
    addTaskIfMissing(state, task);
  }

  let context = null;
  try {
    context = await createProtocolContext();
  } catch (error) {
    context = null;
    const message = error instanceof Error ? error.message : 'Falha ao conectar na camada protocolar.';
    for (const task of state.tasks) {
      if (task.status === 'pending' || task.status === 'blocked') {
        task.status = 'blocked';
        task.updatedAt = nowIso();
        task.message = message;
      }
    }
  }

  if (context) {
    const orderedTasks = [...state.tasks].sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });

    for (const task of orderedTasks) {
      if (!['pending', 'blocked', 'failed'].includes(task.status)) {
        continue;
      }

      task.attempts += 1;
      task.updatedAt = nowIso();

      try {
        const result = await processTask(context, store, state, task);
        task.status = result.status;
        task.updatedAt = nowIso();
        task.txHash = result.txHash ?? task.txHash ?? null;
        task.contract = result.contract ?? task.contract ?? null;
        task.message = result.message ?? null;
      } catch (error) {
        task.status = task.attempts >= 3 ? 'failed' : 'blocked';
        task.updatedAt = nowIso();
        task.message = error instanceof Error ? error.message : 'Falha inesperada ao ancorar a tarefa.';
      }
    }
  }

  state.lastSyncAt = nowIso();
  await saveProtocolState(state);

  return {
    ...summarizeProtocolState(state),
    tasks: [...state.tasks]
      .sort((left, right) => {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      })
      .slice(0, 30),
  };
}

export async function loadProtocolStatus() {
  const state = await loadProtocolState();
  return {
    ...summarizeProtocolState(state),
    tasks: [...state.tasks]
      .sort((left, right) => {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      })
      .slice(0, 30),
  };
}

export const protocolPaths = {
  dataDir,
  protocolStatePath,
};
