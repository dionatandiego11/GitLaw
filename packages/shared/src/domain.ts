export type CategoriaLei =
  | 'urbanismo'
  | 'saude'
  | 'educacao'
  | 'transporte'
  | 'meio-ambiente'
  | 'administracao';

export type ProposalStatus = 'aberto' | 'em-revisao' | 'aprovado' | 'rejeitado';
export type VoteChoice = 'favor' | 'contra' | 'abster';
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
  titulo: string;
  leiAlvoId: string;
  leiAlvoNome: string;
  artigoAlvoId: string;
  artigoAlvoRotulo: string;
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
  oldText: string;
  newText: string;
  quorum: number;
  votingEndsAt: string;
  closedAt?: string;
  resolutionReason?: ProposalResolutionReason;
  votes: VoteRecord[];
  comments: ProposalComment[];
  forkId?: string;
  source: 'municipal' | 'fork';
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
    demo: boolean;
  };
  laws: Law[];
  commits: Commit[];
  proposals: ProposalView[];
  neighborhoods: Neighborhood[];
  forks: ForkExperiment[];
  activities: Activity[];
  profile: ProfileData | null;
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
  demo: boolean;
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
  lawId: string;
  articleId: string;
  title: string;
  justification: string;
  newText: string;
  impactedNeighborhoodIds: string[];
  issueId?: string;
  urgency?: boolean;
}

export interface CreateForkInput {
  authorAddress: string;
  lawId: string;
  bairroId: string;
  name: string;
  objective: string;
  durationMonths: number;
}

export interface ProposalVoteInput {
  address: string;
  choice: VoteChoice;
}

export interface ProposalCommentInput {
  authorAddress: string;
  body: string;
}
