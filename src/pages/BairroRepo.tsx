import { motion } from 'motion/react';
import { GitFork, MapPin, Users, GitPullRequest, GitCommit, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppProvider';

export function BairroRepo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { neighborhoods, forks, proposals, commits, laws } = useApp();
  const neighborhood = neighborhoods.find((item) => item.id === id);
  const neighborhoodForks = forks.filter((fork) => fork.bairroId === id);
  const localProposals = proposals.filter((proposal) =>
    proposal.impactedNeighborhoodIds.includes(String(id)) ||
    neighborhoodForks.some((fork) => fork.id === proposal.forkId),
  );
  const localForkLawIds = neighborhoodForks.map((fork) => fork.leiForkId);
  const localCommits = commits.filter((commit) => localForkLawIds.includes(commit.leiId));

  if (!neighborhood) {
    return <div className="p-4 text-center text-[var(--color-git-muted)]">Bairro não encontrado.</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-git-bg)] pb-20"
    >
      <div className="sticky top-0 z-10 bg-[var(--color-git-bg)]/80 backdrop-blur-md border-b border-[var(--color-git-border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 text-[var(--color-git-muted)] hover:text-[var(--color-git-text)] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate text-[var(--color-git-text)] flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[var(--color-git-purple)]" />
            brumadinho / {neighborhood.repoSlug}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-git-text)] mb-1">Repositório de {neighborhood.nome}</h2>
              <p className="text-sm text-[var(--color-git-muted)]">Variações ativas, propostas locais e histórico do laboratório legislativo do bairro.</p>
            </div>
            <Badge variant="outline" className="text-[var(--color-git-purple)] border-[var(--color-git-purple)] bg-[rgba(137,87,229,0.1)]">
              {neighborhoodForks.length > 0 ? 'Ativo' : 'Sem variação'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[var(--color-git-text)] border-[var(--color-git-border)] bg-[var(--color-git-bg2)]">
              <MapPin className="w-3 h-3 mr-1" /> {neighborhood.nome}
            </Badge>
            <Badge variant="outline" className="text-[var(--color-git-text)] border-[var(--color-git-border)] bg-[var(--color-git-bg2)]">
              <Users className="w-3 h-3 mr-1" /> {neighborhood.populacao} moradores estimados
            </Badge>
            <Badge variant="outline" className="text-[var(--color-git-text)] border-[var(--color-git-border)] bg-[var(--color-git-bg2)]">
              {neighborhoodForks.length} variacoes locais
            </Badge>
          </div>

          <p className="text-sm text-[var(--color-git-text)] leading-relaxed bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] p-4 rounded-xl">
            {neighborhoodForks[0]?.objetivo ?? 'Ainda não há experimentos ativos neste bairro. Crie a primeira variação para começar.'}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider">Métricas da Variação</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1">
              <GitPullRequest className="w-5 h-5 text-[var(--color-git-blue)] mb-1" />
              <span className="text-2xl font-semibold text-[var(--color-git-text)] leading-none">{localProposals.length}</span>
              <span className="text-[10px] font-mono text-[var(--color-git-muted)] uppercase">Propostas locais</span>
            </div>
            <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1">
              <GitCommit className="w-5 h-5 text-[var(--color-git-green)] mb-1" />
              <span className="text-2xl font-semibold text-[var(--color-git-text)] leading-none">{localCommits.length}</span>
              <span className="text-[10px] font-mono text-[var(--color-git-muted)] uppercase">Registros</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider">Propostas ativas</h3>
            <Link to="/propostas" className="text-xs text-[var(--color-git-blue)] hover:underline">Ver todos</Link>
          </div>
          
          <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl overflow-hidden">
            {localProposals.length > 0 ? localProposals.map((proposal, index) => (
              <div key={proposal.id} className={`p-4 flex items-start gap-3 hover:bg-[var(--color-git-bg)] transition-colors cursor-pointer ${index < localProposals.length - 1 ? 'border-b border-[var(--color-git-border2)]' : ''}`} onClick={() => navigate(`/propostas/${proposal.id}`)}>
                <GitPullRequest className="w-4 h-4 text-[var(--color-git-green)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-git-text)]">{proposal.titulo}</p>
                  <p className="text-xs text-[var(--color-git-muted)] mt-1">{proposal.id} · {proposal.status} · {proposal.autor}</p>
                </div>
              </div>
            )) : (
              <div className="p-4 text-sm text-[var(--color-git-muted)]">Nenhuma proposta local aberta neste bairro.</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider">Variações ativas</h3>
          <div className="space-y-3">
            {neighborhoodForks.map((fork) => {
              const law = laws.find((item) => item.id === fork.leiForkId);
              return (
                <div key={fork.id} className="rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-git-text)]">{fork.nome}</p>
                      <p className="text-xs text-[var(--color-git-muted)] mt-1">{law?.titulo ?? 'Variação sem lei vinculada'}</p>
                    </div>
                    <Badge variant="purple">{fork.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
