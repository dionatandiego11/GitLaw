export type CategoriaLei = 'urbanismo' | 'saúde' | 'educação' | 'transporte' | 'meio-ambiente' | 'administração';
export type StatusPR = 'aberto' | 'em-revisao' | 'aprovado' | 'rejeitado';

export interface Lei {
  id: string;
  titulo: string;
  numero: string;
  categoria: CategoriaLei;
  versao: string;
  atualizadaEm: string;
  resumo: string;
  isFork?: boolean;
  bairroId?: string;
  leiOrigemId?: string;
}

export interface PR {
  id: string;
  titulo: string;
  leiAlvoId: string;
  leiAlvoNome: string;
  status: StatusPR;
  autor: string;
  bairro: string;
  criadoEm: string;
  votos: { favor: number; contra: number; total: number; quorum: number };
  ci: { conflito: boolean; orcamento: boolean; constitucional: boolean };
  urgencia: boolean;
  txHash?: string;
}

export interface Atividade {
  id: string;
  tipo: 'pr_novo' | 'voto_pendente' | 'pr_aprovado' | 'comentario' | 'mint_nft';
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
  link: string;
}

export const mockLeis: Lei[] = [
  {
    id: 'lei-1',
    titulo: 'Plano Diretor Estratégico',
    numero: 'Lei Complementar 105/2014',
    categoria: 'urbanismo',
    versao: 'v4.2.0',
    atualizadaEm: '2026-02-15T10:00:00Z',
    resumo: 'Define as regras de zoneamento, uso e ocupação do solo do município.',
  },
  {
    id: 'lei-2',
    titulo: 'Código de Obras e Edificações',
    numero: 'Lei 16.642/2017',
    categoria: 'urbanismo',
    versao: 'v2.1.5',
    atualizadaEm: '2025-11-20T14:30:00Z',
    resumo: 'Estabelece normas para elaboração de projetos e execução de obras.',
  },
  {
    id: 'lei-fork-1',
    titulo: 'Código de Obras (Fork Sapé)',
    numero: 'Exp-001/Sapé',
    categoria: 'urbanismo',
    versao: 'v1.0.0-beta',
    atualizadaEm: '2026-03-10T09:15:00Z',
    resumo: 'Adaptação do Código de Obras para a topografia irregular do bairro Sapé.',
    isFork: true,
    bairroId: 'Sapé',
    leiOrigemId: 'lei-2'
  },
  {
    id: 'lei-3',
    titulo: 'Política Municipal de Meio Ambiente',
    numero: 'Lei 14.887/2009',
    categoria: 'meio-ambiente',
    versao: 'v1.8.2',
    atualizadaEm: '2026-03-01T09:15:00Z',
    resumo: 'Diretrizes para proteção, conservação e melhoria da qualidade ambiental.',
  },
  {
    id: 'lei-4',
    titulo: 'Estatuto do Pedestre',
    numero: 'Lei 16.673/2017',
    categoria: 'transporte',
    versao: 'v1.0.4',
    atualizadaEm: '2024-08-10T11:00:00Z',
    resumo: 'Garante a prioridade, segurança e conforto do pedestre nas vias públicas.',
  },
];

export const mockPRs: PR[] = [
  {
    id: 'pr-101',
    titulo: 'Obrigatoriedade de telhados verdes em novos edifícios comerciais',
    leiAlvoId: 'lei-2',
    leiAlvoNome: 'Código de Obras',
    status: 'em-revisao',
    autor: '0xf39F...9226',
    bairro: 'Centro',
    criadoEm: '2026-03-15T08:00:00Z',
    votos: { favor: 450, contra: 120, total: 570, quorum: 1000 },
    ci: { conflito: true, orcamento: true, constitucional: true },
    urgencia: false,
    txHash: '0xabc123...def4'
  },
  {
    id: 'pr-102',
    titulo: 'Aumento da largura mínima de calçadas em vias arteriais',
    leiAlvoId: 'lei-4',
    leiAlvoNome: 'Estatuto do Pedestre',
    status: 'aberto',
    autor: '0x71bE...3A18',
    bairro: 'Vila Mariana',
    criadoEm: '2026-03-16T14:20:00Z',
    votos: { favor: 890, contra: 45, total: 935, quorum: 1000 },
    ci: { conflito: true, orcamento: false, constitucional: true },
    urgencia: true,
    txHash: '0x999f...111a'
  },
  {
    id: 'pr-103',
    titulo: 'Isenção de IPTU para imóveis com captação de água da chuva',
    leiAlvoId: 'lei-3',
    leiAlvoNome: 'Política de Meio Ambiente',
    status: 'aprovado',
    autor: '0x12aB...99C2',
    bairro: 'Pinheiros',
    criadoEm: '2026-02-28T10:00:00Z',
    votos: { favor: 2100, contra: 300, total: 2400, quorum: 1500 },
    ci: { conflito: true, orcamento: true, constitucional: true },
    urgencia: false,
    txHash: '0x1111...2222'
  },
];

export const mockAtividades: Atividade[] = [
  {
    id: 'act-0',
    tipo: 'mint_nft',
    titulo: 'NFT de Cidadania Emitido',
    descricao: 'Seu token soulbound foi mintado com sucesso. Bairro registrado: Sapé.',
    data: '2026-03-10T10:00:00Z',
    lida: true,
    link: '/perfil',
  },
  {
    id: 'act-1',
    tipo: 'voto_pendente',
    titulo: 'Votação Urgente no seu Bairro',
    descricao: 'O PR-102 (Aumento de calçadas) afeta a Vila Mariana e precisa do seu voto.',
    data: '2026-03-17T09:00:00Z',
    lida: false,
    link: '/propostas/pr-102',
  },
  {
    id: 'act-2',
    tipo: 'pr_novo',
    titulo: 'Nova proposta em Mobilidade',
    descricao: 'Foi aberta uma proposta para criação de ciclofaixa na Av. Paulista.',
    data: '2026-03-16T18:30:00Z',
    lida: true,
    link: '/propostas/pr-104',
  },
  {
    id: 'act-3',
    tipo: 'comentario',
    titulo: 'Resposta ao seu comentário',
    descricao: '0x71bE...3A18 respondeu ao seu comentário no PR-101 sobre telhados verdes.',
    data: '2026-03-15T11:20:00Z',
    lida: true,
    link: '/propostas/pr-101',
  },
];
