import { useDeferredValue, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  FileCode2,
  GitFork,
  Lock,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { LeiCard } from '@/components/LeiCard';
import { useApp } from '@/context/AppProvider';
import type { Law } from '@/shared/domain';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/* ─── Root repository card ─── */
function RootRepoCard({ lei }: { lei: Law }) {
  const isLeiOrganica = lei.id === 'lei-organica';

  const accent = isLeiOrganica
    ? { border: 'rgba(192,132,252,0.35)', bg: 'rgba(192,132,252,0.07)', icon: 'var(--color-git-purple)', iconBg: 'rgba(192,132,252,0.14)', iconBorder: 'rgba(192,132,252,0.28)', quorumColor: 'chip-purple', dotClass: 'status-dot-purple' }
    : { border: 'rgba(56,189,248,0.35)',  bg: 'rgba(56,189,248,0.07)',  icon: 'var(--color-git-blue)',   iconBg: 'rgba(56,189,248,0.14)',   iconBorder: 'rgba(56,189,248,0.28)',   quorumColor: 'chip-blue',   dotClass: 'status-dot-blue'   };

  const Icon = isLeiOrganica ? ShieldAlert : FileCode2;
  const quorumPct = Math.round((lei.quorumEspecial ?? 0.5) * 100);

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      <Link
        to={`/leis/${lei.id}`}
        className="group relative block overflow-hidden rounded-[24px] p-px"
        style={{ background: `linear-gradient(135deg, ${accent.border}, rgba(255,255,255,0.05))` }}
      >
        <div
          className="relative rounded-[23px] p-5 overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${accent.bg} 0%, rgba(4,6,13,1) 55%)` }}
        >
          {/* Shimmer hover */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          />

          {/* Top row */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: accent.iconBg, border: `1px solid ${accent.iconBorder}` }}
              >
                <Icon className="w-5 h-5" style={{ color: accent.icon }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={accent.dotClass + ' status-dot'} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent.icon }}>
                    repositório raiz
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--color-git-muted)] leading-none">{lei.numero}</span>
              </div>
            </div>

            {/* Lock badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] px-2.5 py-1">
              <Lock className="w-3 h-3 text-[var(--color-git-muted)]" />
              <span className="text-[10px] font-bold text-[var(--color-git-muted)] tracking-wide">
                quórum {quorumPct}%
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[18px] font-bold leading-snug tracking-tight text-[var(--color-git-text)] mb-2 group-hover:text-white transition-colors">
            {lei.titulo}
          </h2>
          <p className="text-[13px] text-[var(--color-git-muted2)] leading-relaxed mb-5">
            {lei.resumo}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-between border-t border-[var(--color-git-border)] pt-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--color-git-muted)] font-mono">
                <span className="text-[var(--color-git-text)] font-semibold">{lei.artigos.length}</span> artigos
              </span>
              <span className="text-[11px] text-[var(--color-git-muted)] font-mono">
                <span className="text-[var(--color-git-text)] font-semibold">v{lei.versao}</span>
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-wide" style={{ color: accent.icon }}>
              ver texto completo →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26 } },
};

export function Leis() {
  const { laws } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todas');
  const deferredQuery = useDeferredValue(query);

  const rootOrder = new Map([
    ['lei-organica', 0],
    ['lei-1', 1],
  ]);
  const rootLaws = laws
    .filter((law) => law.isRoot)
    .sort((left, right) => {
      const leftRank = rootOrder.get(left.id) ?? 99;
      const rightRank = rootOrder.get(right.id) ?? 99;
      return leftRank - rightRank || left.titulo.localeCompare(right.titulo);
    });
  const ordinaryLaws = laws.filter((l) => !l.isRoot && !l.isFork);
  const forkLaws   = laws.filter((l) => l.isFork);

  const filteredLaws = [...ordinaryLaws, ...forkLaws].filter((law) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      `${law.titulo} ${law.numero} ${law.resumo}`.toLowerCase().includes(deferredQuery.toLowerCase());
    const matchesCategory =
      category === 'todas' ||
      (category === 'forks' ? Boolean(law.isFork) : law.categoria === category);
    return matchesQuery && matchesCategory;
  });

  const categories = [
    { id: 'todas',         label: 'Todas' },
    { id: 'urbanismo',     label: 'Urbanismo' },
    { id: 'forks',         label: 'Variações locais' },
    { id: 'meio-ambiente', label: 'Meio ambiente' },
    { id: 'transporte',    label: 'Transporte' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 space-y-6"
    >

      {/* ── Hero ── */}
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-[28px] p-px"
        style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.3), rgba(56,189,248,0.2), rgba(255,255,255,0.04))' }}
      >
        <div
          className="rounded-[27px] p-5"
          style={{ background: 'linear-gradient(160deg, rgba(192,132,252,0.08) 0%, rgba(4,6,13,1) 55%)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.3)' }}>
              <BookOpen className="w-4 h-4 text-[var(--color-git-purple)]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-git-purple)]">
              Repositórios legislativos
            </span>
          </div>
          <h1 className="text-[22px] font-bold leading-snug tracking-tight text-[var(--color-git-text)] mb-2">
            Leis como código,<br />
            <span className="gradient-text-purple">com hierarquia clara</span>
          </h1>
          <p className="text-[13px] text-[var(--color-git-muted2)] leading-relaxed">
            A Lei Orgânica e o Plano Diretor são os repositórios raiz. Cada proposta aprovada gera um commit; cada bairro pode ter seu próprio fork.
          </p>
        </div>
      </motion.section>

      {/* ── Root Repositories ── */}
      {rootLaws.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--color-git-muted)]" />
            <h2 className="text-sm font-bold text-[var(--color-git-text)] tracking-tight">
              Repositórios raiz
            </h2>
            <span className="text-[10px] text-[var(--color-git-muted)] bg-white/[0.04] border border-[var(--color-git-border)] rounded-full px-2 py-0.5">
              exigem supermaioria
            </span>
          </div>
          <div className="space-y-3">
            {rootLaws.map((lei) => (
              <div key={lei.id}>
                <RootRepoCard lei={lei} />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Ordinary Laws ── */}
      <motion.section variants={itemVariants} className="space-y-4 rounded-[26px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[var(--color-git-blue)]" />
              <h2 className="text-sm font-bold text-[var(--color-git-text)]">Leis ordinárias e variações</h2>
            </div>
            <p className="text-[12px] text-[var(--color-git-muted2)]">
              Derivam dos repositórios raiz. Cada PR aprovado aqui gera um commit rastreável.
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-git-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar leis, códigos e redações..."
              className="w-full rounded-[16px] border border-[var(--color-git-border2)] bg-[var(--color-git-bg2)] py-3 pl-9 pr-4 text-sm text-[var(--color-git-text)] outline-none transition-all placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[rgba(56,189,248,0.3)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  'min-h-[40px] rounded-[14px] border px-3 py-2 text-[11px] font-semibold leading-tight transition-all',
                  category === item.id
                    ? 'border-[rgba(56,189,248,0.5)] bg-[rgba(56,189,248,0.14)] text-[var(--color-git-blue)]'
                    : 'border-[var(--color-git-border)] bg-[var(--color-git-bg3)] text-[var(--color-git-muted)] hover:border-[var(--color-git-border2)] hover:text-[var(--color-git-text2)]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredLaws.length > 0 ? (
            filteredLaws.map((lei) => <LeiCard key={lei.id} lei={lei} />)
          ) : (
            <div className="rounded-[18px] border border-dashed border-[var(--color-git-border2)] p-6 text-center text-sm text-[var(--color-git-muted)]">
              Nenhuma lei encontrada para os filtros aplicados.
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
