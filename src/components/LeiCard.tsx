import type { Law } from '@/shared/domain';
import { Badge } from './ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, GitFork } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LeiCard({ lei }: { lei: Law; key?: string | number }) {
  return (
    <Link 
      to={`/leis/${lei.id}`}
      className="block bg-[var(--color-git-bg2)] border border-[var(--color-git-border2)] rounded-xl p-4 hover:border-[var(--color-git-muted)] transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {lei.isFork ? <GitFork className="w-4 h-4 text-[var(--color-git-purple)]" /> : <FileText className="w-4 h-4 text-[var(--color-git-muted)]" />}
          <span className="text-xs font-mono text-[var(--color-git-muted)]">{lei.numero}</span>
        </div>
        <Badge variant="outline">{lei.versao}</Badge>
      </div>
      
      <h3 className="font-medium text-[var(--color-git-text)] mb-1 leading-tight">{lei.titulo}</h3>
      <p className="text-xs text-[var(--color-git-muted)] line-clamp-2 mb-3 leading-relaxed">
        {lei.resumo}
      </p>
      
      <div className="flex justify-between items-center mt-auto">
        <div className="flex gap-2">
          <Badge variant="info">{lei.categoria}</Badge>
          {lei.isFork && <Badge variant="purple">Variação: {lei.bairroNome}</Badge>}
        </div>
        <span className="text-[10px] font-mono text-[var(--color-git-muted)]">
          {formatDistanceToNow(new Date(lei.atualizadaEm), { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </Link>
  );
}
