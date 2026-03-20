import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, GitCommit, GitCompare, History, GitPullRequest, GitFork, ShieldAlert, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '@/context/AppProvider';

export function LeiDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { laws, commits, currentCitizen } = useApp();
  const [view, setView] = useState<'texto' | 'blame' | 'commits'>('texto');
  const lei = laws.find((law) => law.id === id);
  const lawCommits = commits.filter((commit) => lei?.commitIds.includes(commit.id));
  const governance = lei?.governanca;

  if (!lei) return <div className="p-4 text-center text-[var(--color-git-muted)]">Lei não encontrada.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-full bg-[var(--color-git-bg)] pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-git-bg)]/80 backdrop-blur-md border-b border-[var(--color-git-border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 text-[var(--color-git-muted)] hover:text-[var(--color-git-text)] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate text-[var(--color-git-text)]">{lei.titulo}</h1>
          <div className="text-[10px] font-mono text-[var(--color-git-muted)]">{lei.numero}</div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Meta */}
        <div className="flex flex-wrap gap-2 items-center">
          {lei.isRoot && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide" style={{ background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.28)', color: 'var(--color-git-purple)' }}>
              <ShieldAlert className="w-3 h-3" />
              Repositório Raiz
            </div>
          )}
          <Badge variant="info">{lei.categoria}</Badge>
          <Badge variant="outline">v{lei.versao}</Badge>
          {lei.isRoot && lei.quorumEspecial && (
            <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: 'var(--color-git-amber)' }}>
              <Lock className="w-3 h-3" />
              {Math.round(lei.quorumEspecial * 100)}% quórum p/ alterar
            </div>
          )}
          <span className="text-xs text-[var(--color-git-muted)] flex items-center">
            Atualizado {formatDistanceToNow(new Date(lei.atualizadaEm), { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        {governance ? (
          <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4 space-y-2">
            <h2 className="text-sm font-semibold text-[var(--color-git-text)]">Politica institucional do documento</h2>
            <div className="grid grid-cols-1 gap-2 text-xs text-[var(--color-git-muted)]">
              <p>Regra de aprovacao: <span className="text-[var(--color-git-text)]">{governance.approvalLabel}</span></p>
              <p>Janela minima de debate: <span className="text-[var(--color-git-text)]">{governance.minimumVotingWindowDays} dias</span></p>
              <p>Protecao institucional: <span className="text-[var(--color-git-text)]">{governance.codeownersLabel}</span></p>
              <p>
                Audiencia publica:
                <span className="text-[var(--color-git-text)]"> {governance.requiresPublicHearing ? 'obrigatoria antes da publicacao' : 'nao obrigatoria'}</span>
              </p>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setView('texto')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors gap-1.5 text-[var(--color-git-text)] ${view === 'texto' ? 'bg-[var(--color-git-blue)] border-[rgba(88,166,255,0.5)] text-white' : 'bg-[var(--color-git-bg2)] border-[var(--color-git-border)] hover:bg-[var(--color-git-bg3)]'}`}>
            <GitCompare className="w-4 h-4" />
            <span className="text-[10px] font-medium">Comparacao</span>
          </button>
          <button onClick={() => setView('blame')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors gap-1.5 text-[var(--color-git-text)] ${view === 'blame' ? 'bg-[var(--color-git-blue)] border-[rgba(88,166,255,0.5)] text-white' : 'bg-[var(--color-git-bg2)] border-[var(--color-git-border)] hover:bg-[var(--color-git-bg3)]'}`}>
            <History className="w-4 h-4" />
            <span className="text-[10px] font-medium">Trechos</span>
          </button>
          <button onClick={() => setView('commits')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors gap-1.5 text-[var(--color-git-text)] ${view === 'commits' ? 'bg-[var(--color-git-blue)] border-[rgba(88,166,255,0.5)] text-white' : 'bg-[var(--color-git-bg2)] border-[var(--color-git-border)] hover:bg-[var(--color-git-bg3)]'}`}>
            <GitCommit className="w-4 h-4" />
            <span className="text-[10px] font-medium">Registros</span>
          </button>
        </div>

        {view === 'texto' ? (
          <div className="space-y-3">
            <p className="font-sans text-sm text-[var(--color-git-muted)] italic">
              {lei.resumo}
            </p>

            {lei.artigos.map((artigo) => (
              <div key={artigo.id} className="rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
                <h3 className="font-semibold text-[var(--color-git-text)] mb-2">{artigo.rotulo}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-git-text)]">{artigo.texto}</p>
              </div>
            ))}
          </div>
        ) : null}

        {view === 'blame' ? (
          <div className="space-y-3">
            {lei.artigos.map((artigo) => (
              <div key={artigo.id} className="rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-[var(--color-git-text)]">{artigo.rotulo}</h3>
                  <span className="text-[10px] font-mono text-[var(--color-git-muted)]">
                    {formatDistanceToNow(new Date(artigo.ultimaAtualizacaoEm), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-git-muted)] mb-2">Último autor: {artigo.ultimoAutor}</p>
                <p className="text-sm leading-relaxed text-[var(--color-git-text)]">{artigo.texto}</p>
              </div>
            ))}
          </div>
        ) : null}

        {view === 'commits' ? (
          <div className="space-y-3">
            {lawCommits.map((commit) => (
              <Link key={commit.id} to={commit.prId ? `/propostas/${commit.prId}` : `/leis/${lei.id}`} className="block rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4 hover:border-[var(--color-git-green)] transition-colors">
                <div className="flex items-start gap-3">
                  <GitCommit className="w-5 h-5 text-[var(--color-git-green)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-git-text)]">{commit.mensagem}</p>
                    <p className="text-xs text-[var(--color-git-muted)] mt-1">{commit.resumo}</p>
                    <p className="text-[10px] font-mono text-[var(--color-git-muted)] mt-3">{commit.autor}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {/* Propose Action */}
        <div className="pt-6 border-t border-[var(--color-git-border)] space-y-3">
          {lei.isRoot && (
            <div className="flex items-start gap-2.5 rounded-[16px] p-3.5" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <Lock className="w-4 h-4 text-[var(--color-git-amber)] shrink-0 mt-0.5" />
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.85)' }}>
                Este e um <strong>repositorio raiz</strong>. Propostas de emenda seguem protecao institucional de <strong>{governance?.codeownersLabel ?? 'quorum qualificado'}</strong> e exigem <strong>{Math.round((lei.quorumEspecial ?? 0.67) * 100)}%</strong> de quorum minimo.
              </p>
            </div>
          )}
          <Link to={`/propostas/nova?lawId=${lei.id}`} className="flex items-center justify-center w-full py-3 bg-[var(--color-git-green)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity gap-2 border border-[rgba(63,185,80,0.5)]">
            <GitPullRequest className="w-4 h-4" />
            Propor Emenda
          </Link>
          {currentCitizen && !lei.isRoot ? (
            <Link to={`/leis/${lei.id}/fork`} className="flex items-center justify-center w-full py-3 bg-[var(--color-git-purple)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity gap-2 border border-[rgba(188,140,255,0.4)]">
              <GitFork className="w-4 h-4" />
              Propor variação para {currentCitizen.bairroNome}
            </Link>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
