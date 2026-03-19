import type { Law } from '@/shared/domain';
import { Badge } from './ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, GitFork } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function LeiCard({ lei }: { lei: Law; key?: string | number }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link 
        to={`/leis/${lei.id}`}
        className="block glass-panel hover-glow rounded-[24px] p-5 mb-4"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {lei.isFork ? <GitFork className="w-5 h-5 text-[var(--color-git-purple)] drop-shadow-[0_0_8px_var(--color-git-purple-glow)]" /> : <FileText className="w-5 h-5 text-[var(--color-git-blue)]" />}
            <span className="text-[11px] font-mono font-medium tracking-wider text-[var(--color-git-muted)]">{lei.numero}</span>
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/5">{lei.versao}</Badge>
        </div>
        
        <h3 className="font-bold text-lg text-[var(--color-git-text)] tracking-tight mb-2 leading-tight">{lei.titulo}</h3>
        <p className="text-sm text-[var(--color-git-muted)] line-clamp-2 mb-5 leading-relaxed">
          {lei.resumo}
        </p>
        
        <div className="flex justify-between items-center mt-auto border-t border-[var(--color-git-border)] pt-4">
          <div className="flex gap-2">
            <Badge variant="info">{lei.categoria}</Badge>
            {lei.isFork && <Badge variant="purple">Variação: {lei.bairroNome}</Badge>}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-git-muted)]">
            {formatDistanceToNow(new Date(lei.atualizadaEm), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
