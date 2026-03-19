import crypto from 'node:crypto';

export function sameAddress(left, right) {
  return String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase();
}

export function must(value, message) {
  if (!value) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return value;
}

export function findNeighborhood(store, id) {
  return store.neighborhoods.find((item) => item.id === id);
}

export function findCitizen(store, address) {
  return store.citizens.find((item) => sameAddress(item.address, address)) ?? null;
}

export function findLatestRequest(store, address) {
  return (
    [...store.citizenshipRequests]
      .reverse()
      .find((item) => sameAddress(item.address, address)) ?? null
  );
}

export function findLaw(store, lawId) {
  return store.laws.find((item) => item.id === lawId) ?? null;
}

export function findProposal(store, proposalId) {
  return store.proposals.find((item) => item.id === proposalId) ?? null;
}

export function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function nowIso() {
  return new Date().toISOString();
}

export function sortByDateDesc(items, selector) {
  return [...items].sort((left, right) => {
    return new Date(selector(right)).getTime() - new Date(selector(left)).getTime();
  });
}

export function nextNumericId(prefix, collection) {
  const max = collection.reduce((current, item) => {
    const value = Number(String(item.id).replace(`${prefix}-`, ''));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);

  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function createHash() {
  return `0x${crypto.randomBytes(6).toString('hex')}`;
}

export function bumpVersion(version) {
  const parts = String(version).split('.').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return '1.0.0';
  }
  parts[2] += 1;
  return parts.join('.');
}

export function buildProposalTally(proposal) {
  const favor = proposal.votes
    .filter((vote) => vote.choice === 'favor')
    .reduce((total, vote) => total + vote.weight, 0);
  const contra = proposal.votes
    .filter((vote) => vote.choice === 'contra')
    .reduce((total, vote) => total + vote.weight, 0);
  const abster = proposal.votes
    .filter((vote) => vote.choice === 'abster')
    .reduce((total, vote) => total + vote.weight, 0);
  const total = favor + contra + abster;
  const supportBase = favor + contra;

  return {
    favor,
    contra,
    abster,
    total,
    quorum: proposal.quorum,
    quorumPct: proposal.quorum > 0 ? Math.min((total / proposal.quorum) * 100, 100) : 0,
    supportPct: supportBase > 0 ? (favor / supportBase) * 100 : 0,
  };
}

export function proposalDeadlineReached(proposal, nowTimestamp = Date.now()) {
  return new Date(proposal.votingEndsAt).getTime() <= nowTimestamp;
}

export function buildVoteLockReason({ proposal, citizen, address, hasVoted, deadlineReached }) {
  if (!address) {
    return 'Conecte uma carteira para participar da votacao.';
  }

  if (!citizen?.ativo) {
    return 'A cidadania ativa e obrigatoria para votar.';
  }

  if (proposal.status === 'em-revisao') {
    return 'A proposta ainda esta em revisao legislativa e nao abriu votacao.';
  }

  if (proposal.status === 'aprovado') {
    return 'Esta proposta ja foi aprovada e encerrada.';
  }

  if (proposal.status === 'rejeitado') {
    switch (proposal.resolutionReason) {
      case 'quorum_insuficiente':
        return 'A proposta foi encerrada por falta de quorum.';
      case 'maioria_contra':
        return 'A proposta foi rejeitada por maioria contraria.';
      case 'empate':
        return 'A proposta foi encerrada em empate.';
      case 'bloqueio_ci':
        return 'A proposta expirou sem sair da revisao legislativa.';
      default:
        return 'Esta proposta ja foi encerrada.';
    }
  }

  if (deadlineReached) {
    return 'O prazo de votacao desta proposta foi encerrado.';
  }

  if (hasVoted) {
    return 'Sua carteira ja registrou voto nesta proposta.';
  }

  return null;
}

export function calculateVoteWeight(store, citizen, proposal) {
  if (!citizen) {
    return 0;
  }

  if (proposal.impactedNeighborhoodIds.includes(citizen.bairroId)) {
    return 1;
  }

  const adjacent = proposal.impactedNeighborhoodIds.some((neighborhoodId) => {
    const neighborhood = findNeighborhood(store, neighborhoodId);
    return neighborhood?.adjacentes.includes(citizen.bairroId);
  });

  if (adjacent) {
    return 0.6;
  }

  return 0.3;
}

export function buildProposalView(store, proposal, address) {
  const citizen = address ? findCitizen(store, address) : null;
  const hasVoted = Boolean(
    citizen &&
      proposal.votes.some((vote) => sameAddress(vote.address, citizen.address)),
  );
  const tally = buildProposalTally(proposal);
  const deadlineReached = proposalDeadlineReached(proposal);
  const canVoteReason = buildVoteLockReason({
    proposal,
    citizen,
    address,
    hasVoted,
    deadlineReached,
  });
  const canVote = canVoteReason === null;

  return {
    ...proposal,
    tally,
    currentUserWeight: citizen ? calculateVoteWeight(store, citizen, proposal) : 0,
    hasVoted,
    canVote,
    canVoteReason,
    deadlineReached,
    quorumRemaining: Math.max(proposal.quorum - tally.total, 0),
  };
}

export function buildProfile(store, address) {
  if (!address) {
    return null;
  }

  const citizen = findCitizen(store, address);
  const pendingRequest = citizen ? null : findLatestRequest(store, address);

  const stats = {
    votos: store.proposals.reduce((total, proposal) => {
      return (
        total +
        proposal.votes.filter((vote) => sameAddress(vote.address, address)).length
      );
    }, 0),
    prs: store.proposals.filter((proposal) => sameAddress(proposal.autor, address)).length,
    commits: store.commits.filter((commit) => sameAddress(commit.autor, address)).length,
  };

  return {
    citizen,
    pendingRequest,
    stats,
    recentActivities: sortByDateDesc(
      store.activities.filter((activity) => sameAddress(activity.address, address)),
      (activity) => activity.data,
    ).slice(0, 5),
    recentCommits: sortByDateDesc(
      store.commits.filter((commit) => sameAddress(commit.autor, address)),
      (commit) => commit.timestamp,
    ).slice(0, 3),
  };
}

export function buildFeed(store) {
  const proposalViews = store.proposals.map((proposal) => buildProposalView(store, proposal, null));
  return {
    urgentProposalIds: proposalViews
      .filter((proposal) => proposal.urgencia && proposal.status !== 'aprovado')
      .slice(0, 3)
      .map((proposal) => proposal.id),
    recentProposalIds: sortByDateDesc(proposalViews, (proposal) => proposal.criadoEm)
      .slice(0, 4)
      .map((proposal) => proposal.id),
    recentLawIds: sortByDateDesc(store.laws, (law) => law.atualizadaEm)
      .slice(0, 4)
      .map((law) => law.id),
    activeForkIds: sortByDateDesc(
      store.forks.filter((fork) => fork.status === 'ativo'),
      (fork) => fork.criadoEm,
    )
      .slice(0, 3)
      .map((fork) => fork.id),
    recentCommitIds: sortByDateDesc(store.commits, (commit) => commit.timestamp)
      .slice(0, 5)
      .map((commit) => commit.id),
  };
}

function buildRejectionDescription(proposal, reason) {
  switch (reason) {
    case 'quorum_insuficiente':
      return `${proposal.titulo} encerrou por prazo sem atingir o quorum minimo.`;
    case 'maioria_contra':
      return `${proposal.titulo} encerrou com mais peso de votos contrarios do que favoraveis.`;
    case 'empate':
      return `${proposal.titulo} encerrou em empate e nao gerou registro legislativo.`;
    case 'bloqueio_ci':
      return `${proposal.titulo} expirou em revisao sem liberar a etapa de votacao.`;
    default:
      return `${proposal.titulo} foi encerrada sem aprovacao.`;
  }
}

export function buildLawSummary(law) {
  return {
    ...law,
    artigos: [...law.artigos].sort((left, right) => left.rotulo.localeCompare(right.rotulo)),
  };
}

export function addActivity(store, activity) {
  store.activities.push(activity);
}

export function createActivity(store, {
  address,
  tipo,
  titulo,
  descricao,
  link,
  data = nowIso(),
  lida = false,
}) {
  addActivity(store, {
    id: nextNumericId('activity', store.activities),
    address,
    tipo,
    titulo,
    descricao,
    data,
    lida,
    link,
  });
}

export function rejectProposal(store, proposal, reason, timestamp) {
  proposal.status = 'rejeitado';
  proposal.closedAt = timestamp;
  proposal.resolutionReason = reason;

  store.citizens.forEach((citizen) => {
    createActivity(store, {
      address: citizen.address,
      tipo: 'pr_rejeitado',
      titulo: `Proposta encerrada: ${proposal.id}`,
      descricao: buildRejectionDescription(proposal, reason),
      link: `/propostas/${proposal.id}`,
      data: timestamp,
      lida: sameAddress(citizen.address, proposal.autor),
    });
  });
}

export function sanitizeText(input) {
  return String(input ?? '').trim().replace(/\s+/g, ' ');
}

export function evaluateCi(_law, article, newText) {
  const lower = newText.toLowerCase();
  const conflictTerms = ['revoga integralmente', 'fica sem efeito imediato', 'dispensa licenciamento'];
  const constitutionalTerms = ['segregacao', 'censura previa', 'trabalho infantil'];
  const budgetTerms = ['subsidi', 'fundo', 'gratuito', 'renuncia fiscal', 'isencao'];

  return {
    conflito: !conflictTerms.some((term) => lower.includes(term)),
    orcamento:
      !budgetTerms.some((term) => lower.includes(term)) ||
      lower.includes('regulamento') ||
      lower.includes('estimativa'),
    constitucional: !constitutionalTerms.some((term) => lower.includes(term)),
    redacao: newText.length > 40 && article?.texto !== newText ? true : null,
  };
}

export function resolveProposalStatus(store, proposal) {
  const tally = buildProposalTally(proposal);
  if (proposal.status === 'aprovado' || proposal.status === 'rejeitado') {
    return;
  }

  if (tally.total < proposal.quorum) {
    return;
  }

  proposal.closedAt = nowIso();
  if (tally.favor > tally.contra) {
    proposal.status = 'aprovado';
    proposal.resolutionReason = 'aprovado_por_quorum';
    applyApprovedProposal(store, proposal);
    return;
  }

  rejectProposal(
    store,
    proposal,
    tally.favor === tally.contra ? 'empate' : 'maioria_contra',
    proposal.closedAt,
  );
}

export function syncProposalLifecycles(store) {
  const nowTimestamp = Date.now();
  let changed = false;

  store.proposals.forEach((proposal) => {
    if (proposal.status === 'aprovado' || proposal.status === 'rejeitado') {
      return;
    }

    if (proposal.status === 'em-revisao') {
      if (!proposalDeadlineReached(proposal, nowTimestamp)) {
        return;
      }

      rejectProposal(store, proposal, 'bloqueio_ci', nowIso());
      changed = true;
      return;
    }

    const tally = buildProposalTally(proposal);
    const shouldFinalize =
      tally.total >= proposal.quorum || proposalDeadlineReached(proposal, nowTimestamp);

    if (!shouldFinalize) {
      return;
    }

    if (tally.total >= proposal.quorum && tally.favor > tally.contra) {
      proposal.status = 'aprovado';
      proposal.closedAt = nowIso();
      proposal.resolutionReason = 'aprovado_por_quorum';
      applyApprovedProposal(store, proposal);
      changed = true;
      return;
    }

    rejectProposal(
      store,
      proposal,
      tally.total < proposal.quorum
        ? 'quorum_insuficiente'
        : tally.favor === tally.contra
          ? 'empate'
          : 'maioria_contra',
      nowIso(),
    );
    changed = true;
  });

  return changed;
}

function applyApprovedProposal(store, proposal) {
  const law = must(findLaw(store, proposal.leiAlvoId), 'Lei alvo nao encontrada.');
  const article = must(
    law.artigos.find((item) => item.id === proposal.artigoAlvoId),
    'Artigo alvo nao encontrado.',
  );

  const previousText = article.texto;
  const timestamp = nowIso();
  const nextVersion = bumpVersion(law.versao);
  const commit = {
    id: nextNumericId('commit', store.commits),
    leiId: law.id,
    prId: proposal.id,
    hash: createHash(),
    mensagem: proposal.titulo,
    autor: proposal.autor,
    timestamp,
    versao: nextVersion,
    resumo: proposal.justificativa,
    articleChanges: [
      {
        articleId: article.id,
        rotulo: article.rotulo,
        before: previousText,
        after: proposal.newText,
      },
    ],
  };

  article.texto = proposal.newText;
  article.ultimaAtualizacaoEm = timestamp;
  article.ultimoAutor = proposal.autor;
  article.ultimoCommitId = commit.id;
  law.versao = nextVersion;
  law.atualizadaEm = timestamp;
  law.commitIds.push(commit.id);
  store.commits.push(commit);

  store.citizens.forEach((citizen) => {
    createActivity(store, {
      address: citizen.address,
      tipo: 'pr_aprovado',
      titulo: `PR aprovado: ${proposal.id}`,
      descricao: `${proposal.titulo} gerou um novo commit em ${law.titulo}.`,
      link: `/propostas/${proposal.id}`,
      data: timestamp,
      lida: sameAddress(citizen.address, proposal.autor),
    });
  });
}
