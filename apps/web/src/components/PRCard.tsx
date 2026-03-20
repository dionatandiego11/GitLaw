import React from 'react';
import type { ProposalView } from '@/shared/domain';
import { Badge } from './ui/Badge';
import { VoteBar } from './ui/VoteBar';
import { AlertTriangle, ArrowUpRight, MapPin, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const statusStyle = {
  aberto:      { dot: 'status-dot-blue',   border: 'rgba(56,189,248,0.2)',  bg: 'rgba(56,189,248,0.04)'  },
  'em-revisao':{ dot: 'status-dot-amber',  border: 'rgba(251,191,36,0.2)', bg: 'rgba(251,191,36,0.04)'  },
  aprovado:    { dot: 'status-dot-green',  border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.04)'  },
  rejeitado:   { dot: 'status-dot-red',    border: 'rgba(248,113,113,0.2)',bg: 'rgba(248,113,113,0.04)' },
} as const;

export function PRCard({ pr }: { pr: ProposalView; key?: React.Key }) {
  const statusConfig = {
    aberto:      { variant: 'info'    as const, label: 'Aberto'     },
    'em-revisao':{ variant: 'warning' as const, label: 'Em Revisão' },
    aprovado:    { variant: 'success' as const, label: 'Aprovado'   },
    rejeitado:   { variant: 'danger'  as const, label: 'Rejeitado'  },
  };

  const resolutionLabels: Record<string, string> = {
    aprovado_por_quorum:  'quórum atingido',
    quorum_insuficiente:  'quórum insuficiente',
    maioria_contra:       'maioria contra',
    empate:               'empate técnico',
    bloqueio_ci:          'bloqueada na validação técnica',
  };

  const config      = statusConfig[pr.status];
  const style       = statusStyle[pr.status];
  const impactedCount = pr.impactedNeighborhoodIds.length;

  const timingLabel =
    pr.status === 'aberto'
      ? `fecha ${formatDistanceToNow(new Date(pr.votingEndsAt), { addSuffix: true, locale: ptBR })}`
      : pr.closedAt
        ? `encerrada ${formatDistanceToNow(new Date(pr.closedAt), { addSuffix: true, locale: ptBR })}`
        : formatDistanceToNow(new Date(pr.criadoEm), { addSuffix: true, locale: ptBR });

  const governanceLabel =
    pr.status === 'em-revisao'
      ? 'aguardando ajuste'
      : pr.status === 'aprovado'
        ? pr.kind === 'variacao_local'
          ? 'pronta p/ variação territorial'
          : 'convertida em registro legislativo'
        : pr.status === 'rejeitado'
          ? resolutionLabels[pr.resolutionReason ?? 'quorum_insuficiente']
          : pr.quorumRemaining > 0
            ? `${formatAmount(pr.quorumRemaining)} faltam para o quórum`
            : 'quórum atingido, aguardando desfecho';

  const targetLabel =
    pr.kind === 'variacao_local'
      ? 'Autorização territorial'
      : pr.artigoAlvoRotulo ?? 'Texto normativo';

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.008 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      <Link
        to={`/propostas/${pr.id}`}
        className="group relative block overflow-hidden rounded-[22px] p-px mb-4"
        style={{
          background: `linear-gradient(135deg, ${style.border}, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
        }}
      >
        <div
          className="relative rounded-[21px] p-5 overflow-hidden transition-all duration-300"
          style={{ background: `linear-gradient(160deg, ${style.bg} 0%, rgba(4,6,13,1) 55%)` }}
        >
          {/* Hover shimmer */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.035) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          />

          {/* Top row: badges + arrow */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`status-dot ${style.dot}`} />
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              {pr.urgencia && (
                <Badge variant="danger">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Urgente
                </Badge>
              )}
              <span className="text-[9px] font-mono text-[var(--color-git-muted)] opacity-60">
                #{pr.id.slice(0, 8)}
              </span>
            </div>
            <motion.div
              className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] flex items-center justify-center transition-all duration-300 group-hover:border-[rgba(56,189,248,0.4)] group-hover:bg-[rgba(56,189,248,0.1)] group-hover:shadow-[0_0_12px_rgba(56,189,248,0.2)]"
              whileHover={{ scale: 1.1 }}
            >
              <ArrowUpRight className="h-4 w-4 text-[var(--color-git-muted)] group-hover:text-[var(--color-git-blue)] transition-colors" />
            </motion.div>
          </div>

          {/* Title */}
          <h3 className="mt-4 text-[17px] font-bold leading-snug text-[var(--color-git-text)] tracking-tight group-hover:text-white transition-colors">
            {pr.titulo}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--color-git-muted2)]">
            {pr.justificativa}
          </p>

          {/* Info grid */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] bg-white/[0.025] border border-[var(--color-git-border)] p-3 flex flex-col gap-0.5">
              <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--color-git-purple)]">
                O que muda
              </div>
              <div className="text-sm font-semibold text-[var(--color-git-text)] line-clamp-1 leading-snug mt-0.5">
                {pr.leiAlvoNome}
              </div>
              <div className="text-[11px] text-[var(--color-git-muted)] line-clamp-1">{targetLabel}</div>
            </div>

            <div className="rounded-[14px] bg-white/[0.025] border border-[var(--color-git-border)] p-3 flex flex-col gap-0.5">
              <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--color-git-teal)]">
                Impacto
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[var(--color-git-teal)]" />
                <span className="text-sm font-semibold text-[var(--color-git-text)]">
                  {impactedCount} bairro{impactedCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-git-muted)]">{timingLabel}</div>
            </div>
          </div>

          {/* Vote Bar */}
          <VoteBar
            favor={pr.tally.favor}
            contra={pr.tally.contra}
            abster={pr.tally.abster}
            quorum={pr.tally.quorum}
            className="mt-4"
          />

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-[var(--color-git-border)] pt-3.5">
            <div className="flex items-center gap-1.5 text-[11px]">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-git-blue)] icon-glow-blue" />
              <span className="font-semibold text-[var(--color-git-text2)]">{pr.bairroNome}</span>
            </div>
            <span className="text-[10px] text-[var(--color-git-muted)] max-w-[44%] text-right truncate">
              {governanceLabel}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
