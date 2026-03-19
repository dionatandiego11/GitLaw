import {
  authorizeAction,
  buildFeed,
  buildLawSummary,
  buildProfile,
  buildProposalView,
  calculateVoteWeight,
  createActivity,
  createHash,
  determineInitialProposalState,
  ensureStoreCollections,
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
  recordDomainEvent,
  resolveProposalKind,
  resolveProposalStatus,
  sanitizeText,
  sameAddress,
  slugify,
  sortByDateDesc,
  syncProposalLifecycles,
  isVariationAuthorizationProposal,
} from '../../domain/src/index.js';
import { DEMO_CITIZEN_ADDRESS } from '../../shared/src/constants.js';

export { syncProposalLifecycles } from '../../domain/src/index.js';

export function buildBootstrap(store, address = null, session = {}) {
  ensureStoreCollections(store);
  const resolvedAddress = session.address ?? address ?? null;

  return {
    session: {
      address: resolvedAddress,
      citizen: resolvedAddress ? findCitizen(store, resolvedAddress) : null,
      pendingRequest: resolvedAddress ? findLatestRequest(store, resolvedAddress) : null,
      authenticated: Boolean(session.authenticated),
      authMethod: session.authMethod ?? null,
      demo: session.authMethod === 'demo',
    },
    laws: sortByDateDesc(store.laws.map(buildLawSummary), (law) => law.atualizadaEm),
    commits: sortByDateDesc(store.commits, (commit) => commit.timestamp),
    proposals: sortByDateDesc(
      store.proposals.map((proposal) => buildProposalView(store, proposal, resolvedAddress)),
      (proposal) => proposal.criadoEm,
    ),
    neighborhoods: [...store.neighborhoods],
    forks: sortByDateDesc(store.forks, (fork) => fork.criadoEm),
    activities: resolvedAddress
      ? sortByDateDesc(
          store.activities.filter((activity) => sameAddress(activity.address, resolvedAddress)),
          (activity) => activity.data,
        )
      : [],
    profile: buildProfile(store, resolvedAddress),
    events: sortByDateDesc(store.events, (event) => event.occurredAt).slice(0, 40),
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
  ensureStoreCollections(store);
  const address = must(input.address?.trim(), 'Endereco de carteira obrigatorio.');
  const authority = authorizeAction(store, {
    action: 'solicitar_cidadania',
    address,
  });
  must(authority.allowed, authority.reason);
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

  recordDomainEvent(store, {
    type: 'CitizenIssued',
    actorAddress: address,
    entityType: 'cidadania',
    entityId: citizen.address,
    occurredAt: createdAt,
    payload: {
      bairroId: neighborhood.id,
      bairroNome: neighborhood.nome,
      nivel: citizen.nivel,
    },
  });

  return { citizenAddress: address };
}

export function createProposal(store, input) {
  ensureStoreCollections(store);
  const authority = authorizeAction(store, {
    action: 'propor',
    address: input.authorAddress,
  });
  must(authority.allowed, authority.reason);
  const citizen = must(
    findCitizen(store, input.authorAddress),
    'Somente cidadaos verificados podem publicar propostas.',
  );
  must(citizen.ativo, 'A cidadania desta carteira nao esta ativa.');

  const law = must(findLaw(store, input.lawId), 'Lei nao encontrada.');
  const kind = resolveProposalKind(input);
  const title = sanitizeText(input.title);
  const justification = sanitizeText(input.justification);
  must(title.length >= 12, 'O titulo da proposta precisa ser mais descritivo.');
  must(
    justification.length >= 24,
    'Explique melhor a justificativa territorial e legislativa da proposta.',
  );
  const createdAt = nowIso();
  const fork = store.forks.find((item) => item.leiForkId === law.id);
  let article = null;
  let newText;
  let impactedNeighborhoodIds;
  let ci;
  let initialState;
  let quorum;
  let variationDraft;

  if (kind === 'variacao_local') {
    must(
      !law.isFork,
      'A autorizacao de variacao territorial deve partir de uma lei base municipal.',
    );
    must(
      !store.forks.some(
        (item) => item.leiOrigemId === law.id && item.bairroId === citizen.bairroId,
      ),
      'Ja existe uma variacao territorial aberta para esta lei e este bairro.',
    );

    const draftName = sanitizeText(input.variationDraft?.name || title);
    const draftObjective = sanitizeText(input.variationDraft?.objective || justification);
    const draftDurationMonths = Number(input.variationDraft?.durationMonths || 0);

    must(draftName.length >= 8, 'Informe um nome claro para a variacao territorial.');
    must(
      draftObjective.length >= 24,
      'Descreva melhor o objetivo administrativo da variacao territorial.',
    );
    must(
      draftDurationMonths > 0,
      'Informe uma duracao valida para a variacao territorial.',
    );

    impactedNeighborhoodIds = [citizen.bairroId];
    ci = {
      conflito: true,
      orcamento: true,
      constitucional: true,
      redacao: true,
    };
    quorum = 1.2;
    variationDraft = {
      nome: draftName,
      slug: slugify(input.variationDraft?.slug || draftName),
      objetivo: draftObjective,
      duracaoMeses: draftDurationMonths,
      bairroId: citizen.bairroId,
      bairroNome: citizen.bairroNome,
    };
  } else {
    article = must(
      law.artigos.find((item) => item.id === input.articleId),
      'Artigo nao encontrado.',
    );
    newText = sanitizeText(input.newText);
    must(newText.length >= 40, 'A proposta precisa de uma comparacao textual completa.');

    const rawImpactedNeighborhoodIds =
      input.impactedNeighborhoodIds?.length > 0
        ? input.impactedNeighborhoodIds
        : [citizen.bairroId];
    impactedNeighborhoodIds = [...new Set(rawImpactedNeighborhoodIds)];

    must(
      impactedNeighborhoodIds.every((neighborhoodId) => Boolean(findNeighborhood(store, neighborhoodId))),
      'Existem bairros impactados invalidos na proposta.',
    );

    ci = evaluateCi(law, article, newText);
    quorum = law.isFork ? 1.2 : 2;
  }

  initialState = determineInitialProposalState({ kind, ci });

  const proposal = {
    id: nextNumericId('pr', store.proposals),
    kind,
    titulo: title,
    leiAlvoId: law.id,
    leiAlvoNome: law.titulo,
    artigoAlvoId: article?.id,
    artigoAlvoRotulo: article?.rotulo,
    status: initialState.status,
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
    oldText: article?.texto,
    newText,
    quorum,
    votingEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    closedAt: undefined,
    resolutionReason: undefined,
    votes: [],
    comments: [],
    forkId: fork?.id,
    source: law.isFork ? 'fork' : 'municipal',
    variationDraft,
  };

  store.proposals.push(proposal);
  recordDomainEvent(store, {
    type: 'ProposalCreated',
    actorAddress: citizen.address,
    entityType: 'proposta',
    entityId: proposal.id,
    occurredAt: createdAt,
    payload: {
      leiId: proposal.leiAlvoId,
      artigoId: proposal.artigoAlvoId ?? null,
      status: proposal.status,
      kind,
      impactedNeighborhoodIds,
      variationDraft:
        kind === 'variacao_local'
          ? {
              bairroId: variationDraft?.bairroId,
              duracaoMeses: variationDraft?.duracaoMeses,
            }
          : null,
    },
  });
  recordDomainEvent(store, {
    type:
      initialState.transition.key === 'initial_to_open'
        ? 'ProposalOpenedForVoting'
        : 'ProposalMovedToReview',
    actorAddress: citizen.address,
    entityType: 'proposta',
    entityId: proposal.id,
    occurredAt: createdAt,
    payload: {
      leiId: proposal.leiAlvoId,
      status: proposal.status,
      kind,
    },
  });

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
  ensureStoreCollections(store);
  syncProposalLifecycles(store);
  const proposal = must(findProposal(store, proposalId), 'Proposta nao encontrada.');
  const citizen = must(
    findCitizen(store, input.address),
    'Somente cidadaos verificados podem votar.',
  );
  const authority = authorizeAction(store, {
    action: 'votar',
    address: input.address,
    proposal,
  });
  must(authority.allowed, authority.reason);

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

  recordDomainEvent(store, {
    type: 'VoteCast',
    actorAddress: citizen.address,
    entityType: 'proposta',
    entityId: proposal.id,
    occurredAt: timestamp,
    payload: {
      choice,
      weight,
      bairroId: citizen.bairroId,
    },
  });

  resolveProposalStatus(store, proposal);

  return { proposal: buildProposalView(store, proposal, citizen.address) };
}

export function addProposalComment(store, proposalId, input) {
  ensureStoreCollections(store);
  syncProposalLifecycles(store);
  const proposal = must(findProposal(store, proposalId), 'Proposta nao encontrada.');
  const citizen = must(
    findCitizen(store, input.authorAddress),
    'Somente cidadaos verificados podem comentar.',
  );
  const authority = authorizeAction(store, {
    action: 'comentar',
    address: input.authorAddress,
    proposal,
  });
  must(authority.allowed, authority.reason);

  const body = sanitizeText(input.body);
  must(body.length >= 8, 'Escreva um comentario mais completo antes de publicar.');

  const timestamp = nowIso();
  proposal.comments.push({
    id: nextNumericId('comment', proposal.comments),
    authorAddress: citizen.address,
    createdAt: timestamp,
    body,
  });

  recordDomainEvent(store, {
    type: 'CommentAdded',
    actorAddress: citizen.address,
    entityType: 'comentario',
    entityId: proposal.id,
    occurredAt: timestamp,
    payload: {
      proposalId: proposal.id,
      bodyPreview: body.slice(0, 120),
    },
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
  ensureStoreCollections(store);
  store.activities.forEach((activity) => {
    if (sameAddress(activity.address, address)) {
      activity.lida = true;
    }
  });

  if (address) {
    recordDomainEvent(store, {
      type: 'ActivitiesMarkedRead',
      actorAddress: address,
      entityType: 'atividade',
      entityId: address,
      payload: {},
    });
  }

  return { ok: true };
}

export function createFork(store, input) {
  ensureStoreCollections(store);
  syncProposalLifecycles(store);
  const citizen = must(
    findCitizen(store, input.authorAddress),
    'Somente cidadaos verificados podem abrir variacoes locais.',
  );
  const sourceProposal = must(
    findProposal(store, input.sourceProposalId),
    'Proposta de autorizacao da variacao nao encontrada.',
  );
  must(
    isVariationAuthorizationProposal(sourceProposal),
    'A ativacao da variacao depende de uma proposta territorial de autorizacao.',
  );
  const law = must(findLaw(store, sourceProposal.leiAlvoId), 'Lei base nao encontrada.');
  const draft = must(
    sourceProposal.variationDraft,
    'A proposta aprovada nao traz os dados da variacao territorial.',
  );
  const neighborhood = must(
    findNeighborhood(store, draft.bairroId),
    'Bairro da variacao territorial nao encontrado.',
  );
  const authority = authorizeAction(store, {
    action: 'criar_variacao',
    address: input.authorAddress,
    proposal: sourceProposal,
    law,
    bairroId: neighborhood.id,
  });
  must(authority.allowed, authority.reason);

  must(
    !store.forks.some(
      (fork) =>
        fork.sourceProposalId === sourceProposal.id ||
        (fork.leiOrigemId === law.id && fork.bairroId === neighborhood.id),
    ),
    'Ja existe uma variacao territorial registrada para esta lei e este bairro.',
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
    resumo: draft.objetivo,
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
    mensagem: `Inicializa variacao local ${draft.nome}`,
    autor: citizen.address,
    timestamp: createdAt,
    versao: forkLaw.versao,
    resumo: draft.objetivo,
    articleChanges: [],
  };

  forkLaw.commitIds.push(commit.id);
  forkLaw.artigos = forkLaw.artigos.map((article) => ({
    ...article,
    ultimoCommitId: commit.id,
  }));

  const fork = {
    id: nextNumericId('fork', store.forks),
    slug: draft.slug,
    nome: draft.nome,
    bairroId: neighborhood.id,
    bairroNome: neighborhood.nome,
    leiOrigemId: law.id,
    leiForkId: forkLaw.id,
    objetivo: draft.objetivo,
    duracaoMeses: draft.duracaoMeses,
    criadoEm: createdAt,
    autor: citizen.address,
    status: 'ativo',
    participantes: 1,
    proposalIds: [],
    sourceProposalId: sourceProposal.id,
  };

  store.commits.push(commit);
  store.laws.push(forkLaw);
  store.forks.push(fork);

  recordDomainEvent(store, {
    type: 'LocalVariationOpened',
    actorAddress: citizen.address,
    entityType: 'variacao',
    entityId: fork.id,
    occurredAt: createdAt,
    payload: {
      bairroId: neighborhood.id,
      leiOrigemId: law.id,
      leiForkId: forkLaw.id,
      sourceProposalId: sourceProposal.id,
    },
  });

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
