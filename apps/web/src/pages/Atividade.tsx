import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, GitPullRequest, Vote, CheckCircle2, Bell, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppProvider';

export function Atividade() {
  const { activities, markAllActivitiesRead } = useApp();

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'voto_pendente': return <Vote className="w-4 h-4 text-[var(--color-git-amber)]" />;
      case 'pr_novo': return <GitPullRequest className="w-4 h-4 text-[var(--color-git-blue)]" />;
      case 'pr_aprovado': return <CheckCircle2 className="w-4 h-4 text-[var(--color-git-green)]" />;
      case 'pr_rejeitado': return <XCircle className="w-4 h-4 text-[var(--color-git-red)]" />;
      case 'comentario': return <MessageSquare className="w-4 h-4 text-[var(--color-git-muted)]" />;
      case 'mint_nft': return <ShieldCheck className="w-4 h-4 text-[var(--color-git-purple)]" />;
      default: return <Bell className="w-4 h-4 text-[var(--color-git-muted)]" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider">Inbox Cívico</h2>
        <button onClick={() => void markAllActivitiesRead()} className="text-xs text-[var(--color-git-blue)] font-medium">Marcar todas lidas</button>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? activities.map(act => (
          <Link 
            key={act.id} 
            to={act.link}
            className={cn(
              "block p-4 rounded-xl border transition-all",
              act.lida ? "bg-[var(--color-git-bg2)] border-[var(--color-git-border)]" : "bg-[rgba(88,166,255,0.06)] border-[rgba(88,166,255,0.3)]"
            )}
          >
            <div className="flex gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                act.lida ? "bg-[var(--color-git-bg3)] border-[var(--color-git-border2)]" : "bg-[var(--color-git-bg)] border-[var(--color-git-blue)]"
              )}>
                {getIcon(act.tipo)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={cn("text-sm leading-tight", act.lida ? "font-medium text-[var(--color-git-text)]" : "font-semibold text-[var(--color-git-blue)]")}>
                    {act.titulo}
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--color-git-muted)] whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(act.data), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", act.lida ? "text-[var(--color-git-muted)]" : "text-[var(--color-git-text)]")}>
                  {act.descricao}
                </p>
              </div>
            </div>
          </Link>
        )) : (
          <div className="rounded-xl border border-dashed border-[var(--color-git-border2)] p-4 text-sm text-[var(--color-git-muted)]">
            Nenhuma atividade para esta carteira ainda.
          </div>
        )}
      </div>
    </motion.div>
  );
}
