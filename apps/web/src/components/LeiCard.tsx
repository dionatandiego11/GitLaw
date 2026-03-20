import type { Law } from '@/shared/domain';
import { Badge } from './ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, GitFork, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function LeiCard({ lei }: { lei: Law; key?: string | number }) {
  const isFork = lei.isFork;
  const accentColor = isFork
    ? 'rgba(192,132,252,0.35)'
    : 'rgba(56,189,248,0.3)';
  const accentSubtle = isFork
    ? 'rgba(192,132,252,0.06)'
    : 'rgba(56,189,248,0.05)';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <Link
        to={`/leis/${lei.id}`}
        className="group relative block overflow-hidden rounded-[22px] p-px mb-4"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
        }}
      >
        {/* Inner card */}
        <div
          className="relative rounded-[21px] p-5 overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${accentSubtle} 0%, rgba(4,6,13,1) 60%)` }}
        >
          {/* Shimmer on hover */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s linear infinite',
            }}
          />

          {/* Header row */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 12 }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isFork
                    ? 'bg-[rgba(192,132,252,0.12)] border border-[rgba(192,132,252,0.2)]'
                    : 'bg-[rgba(56,189,248,0.12)] border border-[rgba(56,189,248,0.2)]'
                }`}
              >
                {isFork ? (
                  <GitFork className="w-4 h-4 text-[var(--color-git-purple)] icon-glow-purple" />
                ) : (
                  <FileText className="w-4 h-4 text-[var(--color-git-blue)] icon-glow-blue" />
                )}
              </motion.div>
              <span className="text-[10px] font-mono font-semibold tracking-widest text-[var(--color-git-muted)] uppercase">
                {lei.numero}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10 bg-white/[0.03] font-mono text-[10px]">
                v{lei.versao}
              </Badge>
              <motion.div
                className="w-7 h-7 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-[rgba(56,189,248,0.35)] group-hover:bg-[rgba(56,189,248,0.08)]"
                whileHover={{ scale: 1.15 }}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-git-blue)]" />
              </motion.div>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-[17px] text-[var(--color-git-text)] tracking-tight mb-2 leading-snug group-hover:text-white transition-colors">
            {lei.titulo}
          </h3>

          {/* Summary */}
          <p className="text-sm text-[var(--color-git-muted2)] line-clamp-2 leading-relaxed mb-5">
            {lei.resumo}
          </p>

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-[var(--color-git-border)] pt-3.5">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="info">{lei.categoria}</Badge>
              {isFork && <Badge variant="purple">Fork · {lei.bairroNome}</Badge>}
            </div>
            <span className="text-[9px] uppercase font-bold tracking-[0.15em] text-[var(--color-git-muted)]">
              {formatDistanceToNow(new Date(lei.atualizadaEm), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
