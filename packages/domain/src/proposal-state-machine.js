const PROPOSAL_STATUSES = [
  {
    status: 'em-revisao',
    label: 'Em revisão',
    workflowStage: 'revisao',
    terminal: false,
    acceptsVotes: false,
    description: 'A proposta entrou em análise institucional e ainda não abriu votação.',
  },
  {
    status: 'aberto',
    label: 'Aberto',
    workflowStage: 'votacao',
    terminal: false,
    acceptsVotes: true,
    description: 'A proposta está admissível e aberta para deliberação com voto ponderado.',
  },
  {
    status: 'aprovado',
    label: 'Aprovado',
    workflowStage: 'consolidacao',
    terminal: true,
    acceptsVotes: false,
    description: 'A proposta atingiu quórum e maioria favorável, podendo gerar consolidação normativa.',
  },
  {
    status: 'rejeitado',
    label: 'Rejeitado',
    workflowStage: 'encerrada',
    terminal: true,
    acceptsVotes: false,
    description: 'A proposta foi encerrada sem aprovação e não recebe novas deliberações.',
  },
];

const PROPOSAL_TRANSITIONS = [
  {
    key: 'initial_to_review',
    fromStatus: null,
    toStatus: 'em-revisao',
    trigger: 'admissibilidade_restrita',
    resolutionReason: null,
    description: 'A proposta nasce em revisão quando a verificação institucional impede abertura imediata de votação.',
  },
  {
    key: 'initial_to_open',
    fromStatus: null,
    toStatus: 'aberto',
    trigger: 'admissibilidade_ok',
    resolutionReason: null,
    description: 'A proposta nasce aberta quando atende a admissibilidade mínima para deliberação.',
  },
  {
    key: 'review_expired',
    fromStatus: 'em-revisao',
    toStatus: 'rejeitado',
    trigger: 'prazo_encerrado_em_revisao',
    resolutionReason: 'bloqueio_ci',
    description: 'A proposta expira em revisão sem cumprir a etapa institucional necessária para abrir votação.',
  },
  {
    key: 'vote_approved',
    fromStatus: 'aberto',
    toStatus: 'aprovado',
    trigger: 'quorum_e_maioria_favoravel',
    resolutionReason: 'aprovado_por_quorum',
    description: 'A proposta atinge o quórum e encerra com maioria favorável.',
  },
  {
    key: 'vote_rejected_quorum',
    fromStatus: 'aberto',
    toStatus: 'rejeitado',
    trigger: 'prazo_sem_quorum',
    resolutionReason: 'quorum_insuficiente',
    description: 'A proposta encerra por prazo sem reunir peso mínimo de participação.',
  },
  {
    key: 'vote_rejected_majority',
    fromStatus: 'aberto',
    toStatus: 'rejeitado',
    trigger: 'maioria_contraria',
    resolutionReason: 'maioria_contra',
    description: 'A proposta atinge o quórum, mas a maioria ponderada vota contra.',
  },
  {
    key: 'vote_rejected_tie',
    fromStatus: 'aberto',
    toStatus: 'rejeitado',
    trigger: 'empate',
    resolutionReason: 'empate',
    description: 'A proposta encerra empatada e não gera consolidação normativa.',
  },
];

const STATUS_META_BY_ID = Object.fromEntries(
  PROPOSAL_STATUSES.map((entry) => [entry.status, Object.freeze({ ...entry })]),
);
const TRANSITION_BY_KEY = Object.fromEntries(
  PROPOSAL_TRANSITIONS.map((entry) => [entry.key, Object.freeze({ ...entry })]),
);

export function getProposalStatusMeta(status) {
  return STATUS_META_BY_ID[status] ?? STATUS_META_BY_ID['em-revisao'];
}

export function resolveProposalWorkflowStage(proposalOrStatus) {
  const status =
    typeof proposalOrStatus === 'string'
      ? proposalOrStatus
      : proposalOrStatus?.status;

  return getProposalStatusMeta(status).workflowStage;
}

export function listProposalStateMachine() {
  return {
    statuses: PROPOSAL_STATUSES.map((entry) => ({ ...entry })),
    transitions: PROPOSAL_TRANSITIONS.map((entry) => ({ ...entry })),
  };
}

export function determineInitialProposalState({ kind, ci }) {
  const shouldOpen =
    kind === 'variacao_local' ||
    (Boolean(ci?.conflito) && Boolean(ci?.constitucional));

  const transition = shouldOpen
    ? TRANSITION_BY_KEY.initial_to_open
    : TRANSITION_BY_KEY.initial_to_review;

  return {
    status: transition.toStatus,
    transition,
  };
}

export function resolveProposalLifecycleTransition({
  proposal,
  tally,
  deadlineReached,
}) {
  if (!proposal || !proposal.status) {
    return null;
  }

  if (proposal.status === 'aprovado' || proposal.status === 'rejeitado') {
    return null;
  }

  if (proposal.status === 'em-revisao') {
    return deadlineReached ? TRANSITION_BY_KEY.review_expired : null;
  }

  if (proposal.status !== 'aberto') {
    return null;
  }

  if (!tally) {
    return null;
  }

  if (tally.total < proposal.quorum && !deadlineReached) {
    return null;
  }

  if (tally.favor > tally.contra && tally.total >= proposal.quorum) {
    return TRANSITION_BY_KEY.vote_approved;
  }

  if (tally.total < proposal.quorum) {
    return TRANSITION_BY_KEY.vote_rejected_quorum;
  }

  if (tally.favor === tally.contra) {
    return TRANSITION_BY_KEY.vote_rejected_tie;
  }

  return TRANSITION_BY_KEY.vote_rejected_majority;
}
