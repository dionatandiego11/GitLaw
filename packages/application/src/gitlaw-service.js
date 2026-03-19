import { DEMO_CITIZEN_ADDRESS } from '../../../server/seed.js';
import {
  buildFeed,
  buildLawSummary,
  buildProfile,
  buildProposalView,
  calculateVoteWeight,
  createActivity,
  createHash,
  evaluateCi,
  findCitizen,
  findLaw,
  findLatestRequest,
  findNeighborhood,
  findProposal,
  must,
  nextNumericId,
  nowIso,
  proposalDeadlineReached,
  resolveProposalStatus,
  sanitizeText,
  sameAddress,
  slugify,
  sortByDateDesc,
  syncProposalLifecycles,
} from '../../domain/src/index.js';

export { syncProposalLifecycles } from '../../domain/src/index.js';

export function buildBootstrap(store, address = null) {
  return {
    session: {
      address: address ?? null,
      citizen: address ? findCitizen(store, address) : null,
      pendingRequest: address ? findLatestRequest(store, address) : null,
      demo: false,
    },
    laws: sortByDateDesc(store.laws.map(buildLawSummary), (law) => law.atualizadaEm),
    commits: sortByDateDesc(store.commits, (commit) => commit.timestamp),
    proposals: sortByDateDesc(
      store.proposals.map((proposal) => buildProposalView(store, proposal, address)),
      (proposal) => proposal.criadoEm,
    ),
    neighborhoods: [...store.neighborhoods],
    forks: sortByDateDesc(store.forks, (fork) => fork.criadoEm),
    activities: address
      ? sortByDateDesc(
          store.activities.filter((activity) => sameAddress(activity.address, address)),
          (activity) => activity.data,
        )
      : [],
    profile: buildProfile(store, address),
    feed: buildFeed(store),
  };
}

export function connectSession(store, { address, demo }) {
  const resolvedAddress = address?.trim() || (demo ? DEMO_CITIZEN_ADDRESS : '');
  must(resolvedAddress, 'Informe uma carteira para iniciar a sessao.');

  return {
    address: resolvedAddress,
    citizen: findCitizen(store, resolvedAddress),
    pendingRequest: findLatestRequest(store, resolvedAddress),
    demo: demo && sameAddress(resolvedAddress, DEMO_CITIZEN_ADDRESS),
  };
}

export function issueCitizenship(store, input) {
  const address = must(input.address?.trim(), 'Endereco de carteira obrigatorio.');
  const neighborhood = must(
    findNeighborhood(store, input.bairroId),
    'Bairro selecionado nao encontrado.',
  );

  if (findCitizen(store, address)) {
    return { citizenAddress: address };
  }

  const createdAt = nowIso();
  const request = {
    id: nextNumericId('request', store.citizenshipRequests),
    address,
    bairroId: neighborhood.id,
    bairroNome: neighborhood.nome,
    documentName: input.documentName || 'documento',
    documentType: input.documentType || 'application/octet-stream',
    documentSize: Number(input.documentSize || 0),
    status: 'emitido',
    createdAt,
  };

  const citizen = {
    address,
    bairroId: neighborhood.id,
    bairroNome: neighborhood.nome,
    nivel: 1,
    emitidoEm: createdAt,
    ativo: true,
    verificadoEm: createdAt,
  };

  store.citizenshipRequests.push(request);
  store.citizens.push(citizen);

  createActivity(store, {
    address,
    tipo: 'mint_nft',
    titulo: 'NFT de cidadania emitido',
    descricao: `Sua cidadania foi emitida para o bairro ${neighborhood.nome} em ambiente alpha local.`,
    link: '/perfil',
    data: createdAt,
    lida: false,
  });

  return { citizenAddress: address };
}

export function createProposal(store, input) {
  const citizen = must(
    findCitizen(store, input.authorAddress),
    'Somente cidadaos verificados podem publicar propostas.',
  );
  must(citizen.ativo, 'A cidadania desta carteira nao esta ativa.');

  const law = must(findLaw(store, input.lawId), 'Lei nao encontrada.');
  const article = must(
    law.artigos.find((item) => item.id === input.articleId),
    'Artigo nao encontrado.',
  );
  const title = sanitizeText(input.title);
  const justification = sanitizeText(input.justification);
  const newText = sanitizeText(input.newText);
  must(title.length >= 12, 'O titulo da proposta precisa ser mais descritivo.');
  must(
    justification.length >= 24,
    'Explique melhor a justificativa territorial e legislativa da proposta.',
  );
  must(newText.length >= 40, 'A proposta precisa de uma comparacao textual completa.');

  const rawImpactedNeighborhoodIds =
    input.impactedNeighborhoodIds?.length > 0
      ? input.impactedNeighborhoodIds
      : [citizen.bairroId];
  const impactedNeighborhoodIds = [...new Set(rawImpactedNeighborhoodIds)];

  must(
    impactedNeighborhoodIds.every((neighborhoodId) => Boolean(findNeighborhood(store, neighborhoodId))),
    'Existem bairros impactados invalidos na proposta.',
  );

  const ci = evaluateCi(law, article, newText);
  const status = ci.conflito && ci.constitucional ? 'aberto' : 'em-revisao';
  const createdAt = nowIso();
  const fork = store.forks.find((item) => item.leiForkId === law.id);
  const proposal = {
    id: nextNumericId('pr', store.proposals),
    titulo: title,
    leiAlvoId: law.id,
    leiAlvoNome: law.titulo,
    artigoAlvoId: article.id,
    artigoAlvoRotulo: article.rotulo,
    status,
    autor: citizen.address,
    bairroId: citizen.bairroId,
    bairroNome: citizen.bairroNome,
    criadoEm: createdAt,
    justificativa: justification,
    issueId: sanitizeText(input.issueId || ''),
    urgencia: Boolean(input.urgency),
    txHash: createHash(),
    impactedNeighborhoodIds,
    ci,
    oldText: article.texto,
    newText,
    quorum: law.isFork ? 1.2 : 2,
    votingEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    closedAt: undefined,
    resolutionReason: undefined,
    votes: [],
    comments: [],
    forkId: fork?.id,
    source: law.isFork ? 'fork' : 'municipal',
  };

  store.proposals.push(proposal);
  if (fork) {
    fork.proposalIds = [...new Set([...(fork.proposalIds ?? []), proposal.id])];
  }

  store.citizens.forEach((recipient) => {
    if (sameAddress(recipient.address, citizen.address)) {
      return;
    }

    createActivity(store, {
      address: recipient.address,
      tipo: 'pr_novo',
      titulo: `Nova proposta aberta: ${proposal.id}`,
      descricao: `${proposal.titulo} entrou em votacao com foco em ${proposal.leiAlvoNome}.`,
      link: `/propostas/${proposal.id}`,
      data: createdAt,
      lida: false,
    });
  });

  return { proposal: buildProposalView(store, proposal, citizen.address) };
}

export function voteOnProposal(store, proposalId, input) {
  syncProposalLifecycles(store);
  const proposal = must(findProposal(store, proposalId), 'Proposta nao encontrada.');
  const citizen = must(
    findCitizen(store, input.address),
    'Somente cidadaos verificados podem votar.',
  );
  must(citizen.ativo, 'A cidadania desta carteira nao esta ativa.');
  must(
    proposal.status === 'aberto',
    proposal.status === 'em-revisao'
      ? 'Esta proposta ainda nao liberou a etapa de votacao.'
      : 'Esta proposta ja foi encerrada.',
  );
  must(
    !proposalDeadlineReached(proposal),
    'O prazo de votacao desta proposta foi encerrado.',
  );
  must(
    !proposal.votes.some((vote) => sameAddress(vote.address, citizen.address)),
    'Sua carteira ja votou nesta proposta.',
  );

  const choice = must(input.choice, 'Escolha um voto valido.');
  must(
    choice === 'favor' || choice === 'contra' || choice === 'abster',
    'Escolha um voto valido.',
  );

  const weight = calculateVoteWeight(store, citizen, proposal);
  const timestamp = nowIso();

  proposal.votes.push({
    address: citizen.address,
    choice,
    weight,
    bairroId: citizen.bairroId,
    bairroNome: citizen.bairroNome,
    createdAt: timestamp,
  });

  resolveProposalStatus(store, proposal);

  return { proposal: buildProposalView(store, proposal, citizen.address) };
}

export function addProposalComment(store, proposalId, input) {
  syncProposalLifecycles(store);
  const proposal = must(findProposal(store, proposalId), 'Proposta nao encontrada.');
  const citizen = must(
    findCitizen(store, input.authorAddress),
    'Somente cidadaos verificados podem comentar.',
  );

  const body = sanitizeText(input.body);
  must(body.length >= 8, 'Escreva um comentario mais completo antes de publicar.');

  const timestamp = nowIso();
  proposal.comments.push({
    id: nextNumericId('comment', proposal.comments),
    authorAddress: citizen.address,
    createdAt: timestamp,
    body,
  });

  if (!sameAddress(citizen.address, proposal.autor)) {
    createActivity(store, {
      address: proposal.autor,
      tipo: 'comentario',
      titulo: `Novo comentario em ${proposal.id}`,
      descricao: `${citizen.bairroNome} comentou: "${body.slice(0, 72)}${body.length > 72 ? '...' : ''}"`,
      link: `/propostas/${proposal.id}`,
      data: timestamp,
      lida: false,
    });
  }

  return { proposal: buildProposalView(store, proposal, citizen.address) };
}

export function markAllActivitiesRead(store, address) {
  store.activities.forEach((activity) => {
    if (sameAddress(activity.address, address)) {
      activity.lida = true;
    }
  });

  return { ok: true };
}

export function createFork(store, input) {
  syncProposalLifecycles(store);
  const citizen = must(
    findCitizen(store, input.authorAddress),
    'Somente cidadaos verificados podem abrir variacoes locais.',
  );
  must(citizen.ativo, 'A cidadania desta carteira nao esta ativa.');
  must(
    citizen.bairroId === input.bairroId,
    'A variacao precisa ser criada para o bairro da cidadania ativa.',
  );

  const law = must(findLaw(store, input.lawId), 'Lei base nao encontrada.');
  const neighborhood = must(findNeighborhood(store, input.bairroId), 'Bairro nao encontrado.');

  must(
    !store.forks.some(
      (fork) =>
        fork.leiOrigemId === law.id &&
        fork.bairroId === neighborhood.id &&
        fork.status === 'ativo',
    ),
    'Ja existe uma variacao ativa desta lei para o seu bairro.',
  );

  must(
    Number(input.durationMonths || 0) > 0,
    'Informe uma duracao valida para o experimento local.',
  );

  const createdAt = nowIso();
  const forkLawId = nextNumericId('lei-fork', store.laws);
  const forkLaw = {
    id: forkLawId,
    titulo: `${law.titulo} (Variacao ${neighborhood.nome})`,
    numero: `Exp-${String(store.forks.length + 1).padStart(3, '0')}/${neighborhood.nome}`,
    categoria: law.categoria,
    versao: '1.0.0',
    atualizadaEm: createdAt,
    resumo: sanitizeText(input.objective),
    isFork: true,
    bairroId: neighborhood.id,
    bairroNome: neighborhood.nome,
    leiOrigemId: law.id,
    artigos: law.artigos.map((article) => ({
      ...article,
      id: `${forkLawId}-${article.id}`,
      ultimaAtualizacaoEm: createdAt,
      ultimoAutor: citizen.address,
    })),
    commitIds: [],
  };

  const commit = {
    id: nextNumericId('commit', store.commits),
    leiId: forkLaw.id,
    hash: createHash(),
    mensagem: `Inicializa variacao local ${sanitizeText(input.name)}`,
    autor: citizen.address,
    timestamp: createdAt,
    versao: forkLaw.versao,
    resumo: sanitizeText(input.objective),
    articleChanges: [],
  };

  forkLaw.commitIds.push(commit.id);
  forkLaw.artigos = forkLaw.artigos.map((article) => ({
    ...article,
    ultimoCommitId: commit.id,
  }));

  const fork = {
    id: nextNumericId('fork', store.forks),
    slug: slugify(input.name),
    nome: sanitizeText(input.name),
    bairroId: neighborhood.id,
    bairroNome: neighborhood.nome,
    leiOrigemId: law.id,
    leiForkId: forkLaw.id,
    objetivo: sanitizeText(input.objective),
    duracaoMeses: Number(input.durationMonths || 6),
    criadoEm: createdAt,
    autor: citizen.address,
    status: 'ativo',
    participantes: 1,
    proposalIds: [],
  };

  store.commits.push(commit);
  store.laws.push(forkLaw);
  store.forks.push(fork);

  store.citizens
    .filter((recipient) => recipient.bairroId === neighborhood.id)
    .forEach((recipient) => {
      createActivity(store, {
        address: recipient.address,
        tipo: 'fork_novo',
        titulo: `Nova variacao local em ${neighborhood.nome}`,
        descricao: `${fork.nome} foi inicializado para experimentacao legislativa local.`,
        link: `/bairros/${neighborhood.id}`,
        data: createdAt,
        lida: sameAddress(recipient.address, citizen.address),
      });
    });

  return { fork };
}
