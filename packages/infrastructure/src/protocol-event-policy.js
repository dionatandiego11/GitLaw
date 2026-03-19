const PROTOCOL_EVENT_POLICIES = Object.freeze({
  CitizenIssued: Object.freeze({
    eventType: 'CitizenIssued',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'citizen_mint',
    description: 'A emissão de cidadania territorial precisa ser ancorada para liberar elegibilidade verificável.',
  }),
  ProposalCreated: Object.freeze({
    eventType: 'ProposalCreated',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'proposal_create',
    description: 'A criação da proposta define o objeto deliberativo que deve existir na camada verificável.',
  }),
  ProposalMovedToReview: Object.freeze({
    eventType: 'ProposalMovedToReview',
    criticality: 'operacional',
    executionLayer: 'off-chain',
    taskType: null,
    description: 'A passagem para revisão é coordenada localmente e não precisa de âncora imediata.',
  }),
  ProposalOpenedForVoting: Object.freeze({
    eventType: 'ProposalOpenedForVoting',
    criticality: 'operacional',
    executionLayer: 'off-chain',
    taskType: null,
    description: 'A abertura de votação é derivada do estado da proposta e segue como projeção off-chain.',
  }),
  VoteCast: Object.freeze({
    eventType: 'VoteCast',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'proposal_vote',
    description: 'O voto é evento crítico e deve permanecer verificável na camada protocolar.',
  }),
  ProposalApproved: Object.freeze({
    eventType: 'ProposalApproved',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'proposal_finalize',
    description: 'A aprovação encerra a deliberação e precisa convergir com a finalização da proposta no contrato.',
  }),
  ProposalRejected: Object.freeze({
    eventType: 'ProposalRejected',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'proposal_finalize',
    description: 'A rejeição também encerra a deliberação e precisa convergir com a finalização protocolar.',
  }),
  LawCommitRecorded: Object.freeze({
    eventType: 'LawCommitRecorded',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'law_commit',
    description: 'O registro legislativo consolidado é âncora normativa e deve ser publicado no repositório verificável.',
  }),
  CommentAdded: Object.freeze({
    eventType: 'CommentAdded',
    criticality: 'deliberativo',
    executionLayer: 'off-chain',
    taskType: null,
    description: 'Comentários permanecem off-chain para manter fluidez deliberativa e custo operacional baixo.',
  }),
  LocalVariationOpened: Object.freeze({
    eventType: 'LocalVariationOpened',
    criticality: 'critico',
    executionLayer: 'on-chain',
    taskType: 'fork_open',
    description: 'A abertura da variação territorial precisa convergir com a autorização protocolar do bairro.',
  }),
  ActivitiesMarkedRead: Object.freeze({
    eventType: 'ActivitiesMarkedRead',
    criticality: 'informativo',
    executionLayer: 'off-chain',
    taskType: null,
    description: 'Leitura de atividades é apenas experiência local de usuário.',
  }),
  SessionAuthenticated: Object.freeze({
    eventType: 'SessionAuthenticated',
    criticality: 'informativo',
    executionLayer: 'off-chain',
    taskType: null,
    description: 'Sessões assinadas são controle operacional local e não exigem registro em contrato.',
  }),
});

export function getProtocolEventPolicy(eventType) {
  return PROTOCOL_EVENT_POLICIES[eventType] ?? null;
}

export function listProtocolEventPolicies() {
  return Object.values(PROTOCOL_EVENT_POLICIES).map((policy) => ({ ...policy }));
}

export function shouldAnchorEventOnChain(eventType) {
  return getProtocolEventPolicy(eventType)?.executionLayer === 'on-chain';
}
