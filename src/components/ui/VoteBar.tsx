import { cn } from '@/lib/utils';

interface VoteBarProps {
  favor: number;
  contra: number;
  abster?: number;
  quorum: number;
  className?: string;
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function VoteBar({ favor, contra, abster = 0, quorum, className }: VoteBarProps) {
  const total = favor + contra + abster;
  const favorPct = total > 0 ? (favor / total) * 100 : 0;
  const contraPct = total > 0 ? (contra / total) * 100 : 0;
  const absterPct = total > 0 ? (abster / total) * 100 : 0;
  const quorumPct = Math.min((total / quorum) * 100, 100);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-git-muted)]">
        <span className="font-medium text-[var(--color-git-green)]">{formatScore(favor)} a favor</span>
        <span className="font-medium text-[var(--color-git-red)]">{formatScore(contra)} contra</span>
        <span className="font-medium">{formatScore(abster)} abstenções</span>
        <span>
          {formatScore(total)} / {formatScore(quorum)} de quórum
          {' · '}
          {quorumPct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full bg-[var(--color-git-bg3)] rounded-full overflow-hidden flex border border-[var(--color-git-border)]">
        <div 
          className="h-full bg-[var(--color-git-green)] transition-all duration-500" 
          style={{ width: `${favorPct}%` }} 
        />
        <div
          className="h-full bg-[rgba(139,148,158,0.55)] transition-all duration-500"
          style={{ width: `${absterPct}%` }}
        />
        <div 
          className="h-full bg-[var(--color-git-red)] transition-all duration-500" 
          style={{ width: `${contraPct}%` }} 
        />
      </div>
    </div>
  );
}
