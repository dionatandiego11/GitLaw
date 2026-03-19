import { motion } from 'motion/react';
import { ShieldCheck, MapPin, Activity, Vote, GitPullRequest, GitCommit } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';

export function Perfil() {
  const { currentAddress, currentCitizen, profile } = useApp();

  if (!currentAddress) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-[var(--color-git-text)]">Nenhuma carteira conectada</h1>
          <p className="text-sm text-[var(--color-git-muted)]">Conecte uma carteira para ver seu perfil civico on-chain.</p>
          <Link to="/connect" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-blue)] text-white rounded-xl text-sm font-medium">
            Conectar carteira
          </Link>
        </div>
      </div>
    );
  }

  if (!currentCitizen || !profile) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-[var(--color-git-text)]">Carteira conectada sem cidadania ativa</h1>
          <p className="text-sm text-[var(--color-git-muted)]">Solicite sua cidadania para abrir propostas, votar e criar variações locais.</p>
          <Link to="/cidadania/solicitar" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-green)] text-white rounded-xl text-sm font-medium">
            Solicitar cidadania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6 pb-20"
    >
      <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-git-purple)]/10 rounded-bl-full -mr-8 -mt-8 blur-2xl" />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-git-bg)] border-2 border-[var(--color-git-purple)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(137,87,229,0.3)]">
            <ShieldCheck className="w-8 h-8 text-[var(--color-git-purple)]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-[var(--color-git-text)] truncate">Cidadão Verificado</h1>
              {currentCitizen.ativo && <Badge variant="success" className="text-[10px] px-1.5 py-0">Ativo</Badge>}
            </div>
            <div className="font-mono text-xs text-[var(--color-git-muted)] truncate mb-3">
              {currentCitizen.address}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[var(--color-git-text)] border-[var(--color-git-border)] bg-[var(--color-git-bg)]">
                <MapPin className="w-3 h-3 mr-1" /> {currentCitizen.bairroNome}
              </Badge>
              <Badge variant="outline" className="text-[var(--color-git-text)] border-[var(--color-git-border)] bg-[var(--color-git-bg)]">
                <Activity className="w-3 h-3 mr-1" /> Nível {currentCitizen.nivel}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[var(--color-git-border2)] flex justify-between items-center text-xs text-[var(--color-git-muted)]">
          <span>NFT Soulbound (ERC-721)</span>
          <span>Emitido {formatDistanceToNow(new Date(currentCitizen.emitidoEm), { addSuffix: true, locale: ptBR })}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider">Métricas de Participação</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1">
            <Vote className="w-5 h-5 text-[var(--color-git-amber)] mb-1" />
            <span className="text-2xl font-semibold text-[var(--color-git-text)] leading-none">{profile.stats.votos}</span>
            <span className="text-[10px] font-mono text-[var(--color-git-muted)] uppercase">Votos</span>
          </div>
          <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1">
            <GitPullRequest className="w-5 h-5 text-[var(--color-git-blue)] mb-1" />
            <span className="text-2xl font-semibold text-[var(--color-git-text)] leading-none">{profile.stats.prs}</span>
            <span className="text-[10px] font-mono text-[var(--color-git-muted)] uppercase">Propostas</span>
          </div>
          <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1">
            <GitCommit className="w-5 h-5 text-[var(--color-git-green)] mb-1" />
            <span className="text-2xl font-semibold text-[var(--color-git-text)] leading-none">{profile.stats.commits}</span>
            <span className="text-[10px] font-mono text-[var(--color-git-muted)] uppercase">Registros</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider">Histórico Recente</h2>
        <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl overflow-hidden">
          {profile.recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 border-b border-[var(--color-git-border2)] last:border-0 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[rgba(88,166,255,0.1)] flex items-center justify-center shrink-0">
                {activity.tipo === 'mint_nft' ? (
                  <ShieldCheck className="w-4 h-4 text-[var(--color-git-purple)]" />
                ) : activity.tipo === 'voto_pendente' ? (
                  <Vote className="w-4 h-4 text-[var(--color-git-amber)]" />
                ) : activity.tipo === 'pr_aprovado' ? (
                  <GitCommit className="w-4 h-4 text-[var(--color-git-green)]" />
                ) : (
                  <GitPullRequest className="w-4 h-4 text-[var(--color-git-blue)]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--color-git-text)]">{activity.titulo}</p>
                <p className="text-xs text-[var(--color-git-muted)] mt-0.5">
                  {formatDistanceToNow(new Date(activity.data), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
