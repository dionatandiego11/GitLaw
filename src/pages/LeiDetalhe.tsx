import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, GitCommit, GitCompare, History, GitPullRequest, GitFork } from 'lucide-react';
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{lei.categoria}</Badge>
          <Badge variant="outline">{lei.versao}</Badge>
          <span className="text-xs text-[var(--color-git-muted)] flex items-center">
            Atualizado {formatDistanceToNow(new Date(lei.atualizadaEm), { addSuffix: true, locale: ptBR })}
          </span>
        </div>

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
          <Link to={`/propostas/nova?lawId=${lei.id}`} className="flex items-center justify-center w-full py-3 bg-[var(--color-git-green)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity gap-2 border border-[rgba(63,185,80,0.5)]">
            <GitPullRequest className="w-4 h-4" />
            Propor Emenda
          </Link>
          {currentCitizen ? (
            <Link to={`/leis/${lei.id}/fork`} className="flex items-center justify-center w-full py-3 bg-[var(--color-git-purple)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity gap-2 border border-[rgba(188,140,255,0.4)]">
              <GitFork className="w-4 h-4" />
              Criar variação para {currentCitizen.bairroNome}
            </Link>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
