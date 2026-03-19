import React from 'react';
import type { ProposalView } from '@/shared/domain';
import { Badge } from './ui/Badge';
import { VoteBar } from './ui/VoteBar';
import { AlertTriangle, ArrowRight, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function PRCard({ pr }: { pr: ProposalView; key?: React.Key }) {
  const statusConfig = {
    'aberto': { variant: 'info' as const, label: 'Aberto' },
    'em-revisao': { variant: 'warning' as const, label: 'Em Revisão' },
    'aprovado': { variant: 'success' as const, label: 'Aprovado' },
    'rejeitado': { variant: 'danger' as const, label: 'Rejeitado' },
  };
  const resolutionLabels = {
    aprovado_por_quorum: 'quorum atingido',
    quorum_insuficiente: 'quorum insuficiente',
    maioria_contra: 'maioria contra',
    empate: 'empate tecnico',
    bloqueio_ci: 'bloqueada na validacao tecnica',
  };

  const config = statusConfig[pr.status];
  const impactedCount = pr.impactedNeighborhoodIds.length;
  const timingLabel =
    pr.status === 'aberto'
      ? `fecha ${formatDistanceToNow(new Date(pr.votingEndsAt), { addSuffix: true, locale: ptBR })}`
      : pr.closedAt
        ? `encerrada ${formatDistanceToNow(new Date(pr.closedAt), { addSuffix: true, locale: ptBR })}`
        : formatDistanceToNow(new Date(pr.criadoEm), { addSuffix: true, locale: ptBR });
  const governanceLabel =
    pr.status === 'em-revisao'
      ? 'aguardando ajuste para liberar votos'
      : pr.status === 'aprovado'
        ? pr.kind === 'variacao_local'
          ? 'aprovada e pronta para ativar a variacao territorial'
          : 'aprovada e convertida em registro legislativo'
        : pr.status === 'rejeitado'
          ? resolutionLabels[pr.resolutionReason ?? 'quorum_insuficiente']
          : pr.quorumRemaining > 0
            ? `${formatAmount(pr.quorumRemaining)} ainda faltam para o quorum`
            : 'quorum atingido, aguardando desfecho';
  const targetLabel =
    pr.kind === 'variacao_local' ? 'Autorizacao territorial' : pr.artigoAlvoRotulo ?? 'Texto normativo';

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      <Link 
        to={`/propostas/${pr.id}`}
        className="group block rounded-[24px] glass-panel p-5 transition-all hover-glow"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
            {pr.urgencia && (
              <Badge variant="danger">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Prioridade alta
              </Badge>
            )}
            <span className="text-[10px] font-mono text-[var(--color-git-muted)]">{pr.id}</span>
          </div>
          <div className="rounded-full bg-white/[0.05] p-2 transition-colors group-hover:bg-[var(--color-git-blue)]/20">
            <ArrowRight className="h-4 w-4 text-[var(--color-git-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-git-blue)]" />
          </div>
        </div>
        
        <h3 className="mt-4 text-lg font-bold leading-tight text-[var(--color-git-text)] tracking-tight">{pr.titulo}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-git-muted)]">
          {pr.justificativa}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[16px] bg-white/[0.03] border border-white/[0.02] p-3 flex flex-col justify-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-git-purple)]">O que muda</div>
            <div className="mt-1 text-sm font-semibold text-[var(--color-git-text)] line-clamp-1">{pr.leiAlvoNome}</div>
            <div className="text-[11px] text-[var(--color-git-muted)] line-clamp-1">{targetLabel}</div>
          </div>
          <div className="rounded-[16px] bg-white/[0.03] border border-white/[0.02] p-3 flex flex-col justify-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-git-green)]">Impacto</div>
            <div className="mt-1 text-sm font-semibold text-[var(--color-git-text)]">
              {impactedCount} bairro{impactedCount > 1 ? 's' : ''}
            </div>
            <div className="text-[11px] text-[var(--color-git-muted)]">{timingLabel}</div>
          </div>
        </div>

        <VoteBar
          favor={pr.tally.favor}
          contra={pr.tally.contra}
          abster={pr.tally.abster}
          quorum={pr.tally.quorum}
          className="mt-5"
        />
        
        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-git-border)] pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-git-muted)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-git-blue)] drop-shadow-[0_0_2px_var(--color-git-blue)]" />
            <span className="font-medium text-[var(--color-git-text)]">{pr.bairroNome}</span>
          </div>
          <span className="text-[11px] font-medium text-[var(--color-git-muted)]">
            {governanceLabel}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
