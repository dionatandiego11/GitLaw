import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface CIStatusProps {
  status: boolean | null;
  label: string;
}

export function CIStatus({ status, label }: CIStatusProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      {status === true && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-git-green)]" />}
      {status === false && <XCircle className="w-3.5 h-3.5 text-[var(--color-git-red)]" />}
      {status === null && <Clock className="w-3.5 h-3.5 text-[var(--color-git-amber)]" />}
      <span className={cn(
        status === true ? 'text-[var(--color-git-green)]' : 
        status === false ? 'text-[var(--color-git-red)]' : 'text-[var(--color-git-amber)]'
      )}>
        {label}
      </span>
    </div>
  );
}
