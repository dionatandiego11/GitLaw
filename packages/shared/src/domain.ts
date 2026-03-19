export type CategoriaLei =
  | 'urbanismo'
  | 'saude'
  | 'educacao'
  | 'transporte'
  | 'meio-ambiente'
  | 'administracao';

export type ProposalStatus = 'aberto' | 'em-revisao' | 'aprovado' | 'rejeitado';
export type ProposalKind = 'emenda' | 'variacao_local';
export type ProposalWorkflowStage =
  | 'admissibilidade'
  | 'revisao'
  | 'votacao'
  | 'consolidacao'
  | 'encerrada';
export type VoteChoice = 'favor' | 'contra' | 'abster';
export type SessionAuthMethod = 'demo' | 'wallet';
export type AuthorityAction =
  | 'solicitar_cidadania'
  | 'propor'
  | 'votar'
  | 'comentar'
  | 'criar_variacao';
export type ActivityType =
  | 'pr_novo'
  | 'voto_pendente'
  | 'pr_aprovado'
  | 'pr_rejeitado'
  | 'comentario'
  | 'mint_nft'
  | 'fork_novo';

export type ProposalResolutionReason =
  | 'aprovado_por_quorum'
  | 'quorum_insuficiente'
  | 'maioria_contra'
  | 'empate'
  | 'bloqueio_ci';

export type DomainEventType =
  | 'CitizenIssued'
  | 'ProposalCreated'
  | 'ProposalMovedToReview'
  | 'ProposalOpenedForVoting'
  | 'VoteCast'
  | 'ProposalApproved'
  | 'ProposalRejected'
  | 'LawCommitRecorded'
  | 'CommentAdded'
  | 'LocalVariationOpened'
  | 'ActivitiesMarkedRead'
  | 'SessionAuthenticated';

export interface AuthorityGrant {
  action: AuthorityAction;
  allowed: boolean;
  reason: string | null;
}

export interface DomainEvent {
  id: string;
  type: DomainEventType;
  actorAddress: string | null;
  entityType: 'cidadania' | 'proposta' | 'lei' | 'variacao' | 'comentario' | 'sessao' | 'atividade';
  entityId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface Neighborhood {
  id: string;
  nome: string;
  adjacentes: string[];
  populacao: number;
  repoSlug: string;
}

export interface Citizen {
  address: string;
  bairroId: string;
  bairroNome: string;
  nivel: number;
  emitidoEm: string;
  ativo: boolean;
  verificadoEm: string;
}

export interface CitizenshipRequest {
  id: string;
  address: string;
  bairroId: string;
  bairroNome: string;
  documentName: string;
  documentType: string;
  documentSize: number;
  status: 'emitido' | 'pendente';
  createdAt: string;
}

export interface ArticleChange {
  articleId: string;
  rotulo: string;
  before: string;
  after: string;
}

export interface Commit {
  id: string;
  leiId: string;
  prId?: string;
  hash: string;
  mensagem: string;
  autor: string;
  timestamp: string;
  versao: string;
  resumo: string;
  articleChanges: ArticleChange[];
}

export interface LawArticle {
  id: string;
  rotulo: string;
  texto: string;
  ultimaAtualizacaoEm: string;
  ultimoAutor: string;
  ultimoCommitId: string;
}

export interface Law {
  id: string;
  titulo: string;
  numero: string;
  categoria: CategoriaLei;
  versao: string;
  atualizadaEm: string;
  resumo: string;
  isFork?: boolean;
  bairroId?: string;
  bairroNome?: string;
  leiOrigemId?: string;
  artigos: LawArticle[];
  commitIds: string[];
}

export interface ProposalCI {
  conflito: boolean;
  orcamento: boolean;
  constitucional: boolean;
  redacao: boolean | null;
}

export interface ProposalVariationDraft {
  nome: string;
  slug: string;
  objetivo: string;
  duracaoMeses: number;
  bairroId: string;
  bairroNome: string;
}

export interface VoteRecord {
  address: string;
  choice: VoteChoice;
  weight: number;
  bairroId: string;
  bairroNome: string;
  createdAt: string;
}

export interface ProposalComment {
  id: string;
  authorAddress: string;
  createdAt: string;
  body: string;
}

export interface Proposal {
  id: string;
  kind: ProposalKind;
  titulo: string;
  leiAlvoId: string;
  leiAlvoNome: string;
  artigoAlvoId?: string;
  artigoAlvoRotulo?: string;
  status: ProposalStatus;
  autor: string;
  bairroId: string;
  bairroNome: string;
  criadoEm: string;
  justificativa: string;
  issueId?: string;
  urgencia: boolean;
  txHash?: string;
  impactedNeighborhoodIds: string[];
  ci: ProposalCI;
  oldText?: string;
  newText?: string;
  quorum: number;
  votingEndsAt: string;
  closedAt?: string;
  resolutionReason?: ProposalResolutionReason;
  votes: VoteRecord[];
  comments: ProposalComment[];
  forkId?: string;
  source: 'municipal' | 'fork';
  variationDraft?: ProposalVariationDraft;
}

export interface ProposalTally {
  favor: number;
  contra: number;
  abster: number;
  total: number;
  quorum: number;
  quorumPct: number;
  supportPct: number;
}

export interface ProposalView extends Proposal {
  tally: ProposalTally;
  workflowStage: ProposalWorkflowStage;
  availableActions: AuthorityGrant[];
  currentUserWeight: number;
  hasVoted: boolean;
  canVote: boolean;
  canVoteReason: string | null;
  deadlineReached: boolean;
  quorumRemaining: number;
}

export interface ForkExperiment {
  id: string;
  slug: string;
  nome: string;
  bairroId: string;
  bairroNome: string;
  leiOrigemId: string;
  leiForkId: string;
  objetivo: string;
  duracaoMeses: number;
  criadoEm: string;
  autor: string;
  status: 'ativo' | 'concluido' | 'pendente';
  participantes: number;
  proposalIds: string[];
  sourceProposalId: string;
}

export interface Activity {
  id: string;
  address: string;
  tipo: ActivityType;
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
  link: string;
}

export interface ProfileData {
  citizen: Citizen | null;
  pendingRequest: CitizenshipRequest | null;
  stats: {
    votos: number;
    prs: number;
    commits: number;
  };
  recentActivities: Activity[];
  recentCommits: Commit[];
}

export interface BootstrapPayload {
  session: {
    address: string | null;
    citizen: Citizen | null;
    pendingRequest: CitizenshipRequest | null;
    authenticated: boolean;
    authMethod: SessionAuthMethod | null;
    demo: boolean;
  };
  laws: Law[];
  commits: Commit[];
  proposals: ProposalView[];
  neighborhoods: Neighborhood[];
  forks: ForkExperiment[];
  activities: Activity[];
  profile: ProfileData | null;
  events: DomainEvent[];
  feed: {
    urgentProposalIds: string[];
    recentProposalIds: string[];
    recentLawIds: string[];
    activeForkIds: string[];
    recentCommitIds: string[];
  };
}

export interface ChainDeploymentSnapshot {
  name: string;
  network: string;
  chainId: number;
  blockNumber: number;
  deployedAt: string;
  deployer: string;
  contracts: {
    cidadaniaToken: string;
    gitLawRepository: string;
    weightedVoting: string;
    neighborhoodForks: string;
  };
}

export interface ConnectSessionInput {
  address?: string | null;
  demo?: boolean;
}

export interface ConnectSessionResponse {
  address: string;
  citizen: Citizen | null;
  pendingRequest: CitizenshipRequest | null;
  authenticated: boolean;
  authMethod: SessionAuthMethod;
  demo: boolean;
  sessionToken: string;
}

export interface WalletChallengeInput {
  address: string;
}

export interface WalletChallengeResponse {
  address: string;
  nonce: string;
  message: string;
  expiresAt: string;
}

export interface WalletVerifyInput {
  address: string;
  signature: string;
}

export interface CitizenshipIssueInput {
  address: string;
  bairroId: string;
  documentName: string;
  documentType: string;
  documentSize: number;
}

export interface CreateProposalInput {
  authorAddress: string;
  kind?: ProposalKind;
  lawId: string;
  articleId?: string;
  title: string;
  justification: string;
  newText?: string;
  impactedNeighborhoodIds?: string[];
  issueId?: string;
  urgency?: boolean;
  variationDraft?: {
    name: string;
    objective: string;
    durationMonths: number;
    slug?: string;
  };
}

export interface CreateForkInput {
  authorAddress: string;
  bairroId: string;
  sourceProposalId: string;
}

export interface ProposalVoteInput {
  address: string;
  choice: VoteChoice;
}

export interface ProposalCommentInput {
  authorAddress: string;
  body: string;
}
