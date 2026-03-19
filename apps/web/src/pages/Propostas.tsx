import { useDeferredValue, useState } from 'react';
import { PRCard } from '@/components/PRCard';
import { motion } from 'motion/react';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';

export function Propostas() {
  const navigate = useNavigate();
  const { proposals, currentCitizen } = useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todas');
  const deferredQuery = useDeferredValue(query);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      `${proposal.id} ${proposal.titulo} ${proposal.leiAlvoNome} ${proposal.justificativa}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());

    const matchesStatus =
      status === 'todas' ||
      (status === 'meu-bairro'
        ? Boolean(currentCitizen && proposal.impactedNeighborhoodIds.includes(currentCitizen.bairroId))
        : proposal.status === status);

    return matchesQuery && matchesStatus;
  });

  const statuses = [
    { id: 'todas', label: 'Todas' },
    { id: 'aberto', label: 'Abertas' },
    { id: 'em-revisao', label: 'Em revisão' },
    { id: 'aprovado', label: 'Aprovadas' },
    { id: 'rejeitado', label: 'Rejeitadas' },
    { id: 'meu-bairro', label: 'Meu bairro' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-5"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-git-text)]">Propostas</h1>
        <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
          Acompanhe votações abertas, filtre o que importa para seu bairro e crie novas propostas com mais clareza.
        </p>
      </div>

      <section className="rounded-[28px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-git-muted)]" />
            <input 
              type="text" 
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar propostas..." 
              className="w-full pl-9 pr-4 py-3 bg-[var(--color-git-bg2)] border border-[var(--color-git-border2)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-2xl text-sm transition-all outline-none text-[var(--color-git-text)] placeholder:text-[var(--color-git-muted)]"
            />
          </div>
          <button 
            onClick={() => navigate('/propostas/nova')}
            className="inline-flex min-w-[3.25rem] items-center justify-center rounded-2xl bg-[var(--color-git-green)] hover:opacity-90 text-white px-4 transition-opacity border border-[rgba(63,185,80,0.5)]"
            aria-label="Nova proposta"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {statuses.map((item) => (
            <button
              key={item.id}
              onClick={() => setStatus(item.id)}
              className={`min-h-[42px] rounded-2xl border px-3 py-2 text-[11px] font-medium leading-tight transition-colors ${
                status === item.id
                  ? 'bg-[var(--color-git-blue)] text-white border-[rgba(88,166,255,0.5)]'
                  : 'bg-[var(--color-git-bg3)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--color-git-text)] border-[var(--color-git-border)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {filteredProposals.length > 0 ? filteredProposals.map((pr) => (
          <PRCard key={pr.id} pr={pr} />
        )) : (
          <div className="rounded-xl border border-dashed border-[var(--color-git-border2)] p-4 text-sm text-[var(--color-git-muted)]">
            Nenhuma proposta encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </motion.div>
  );
}
