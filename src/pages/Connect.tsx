import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Vote,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';

function StepItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Wallet;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[24px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)] text-[var(--color-git-blue)]">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-git-text)]">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{description}</p>
      </div>
    </div>
  );
}

export function Connect() {
  const navigate = useNavigate();
  const { connectWallet, connectDemoWallet } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (mode: 'wallet' | 'demo') => {
    setIsConnecting(true);
    setError(null);

    try {
      const session = mode === 'wallet' ? await connectWallet() : await connectDemoWallet();
      navigate(session.citizen ? '/' : '/cidadania/solicitar');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível iniciar sua sessão agora.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[var(--color-git-bg)] px-4 py-8"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <section className="overflow-hidden rounded-[32px] border border-[var(--color-git-border)] bg-[linear-gradient(180deg,rgba(88,166,255,0.14),rgba(13,17,23,0.98)_32%,rgba(13,17,23,1)_100%)] p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(88,166,255,0.32)] bg-[rgba(88,166,255,0.12)]">
            <ShieldCheck className="h-7 w-7 text-[var(--color-git-blue)]" />
          </div>

          <div className="mt-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(230,237,243,0.66)]">
              Comece por aqui
            </span>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight text-[var(--color-git-text)]">
              Participe do GitLaw sem se perder
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(230,237,243,0.72)]">
              O fluxo inicial agora é simples: entrar, validar residência e só depois acompanhar ou votar nas propostas do seu bairro.
            </p>
          </div>

          <div className="mt-5 rounded-[26px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(230,237,243,0.58)]">
              Sua jornada
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-[rgba(88,166,255,0.24)] bg-[rgba(88,166,255,0.08)] p-3 text-center">
                <div className="text-xs font-semibold text-[var(--color-git-text)]">1</div>
                <div className="mt-1 text-[11px] text-[var(--color-git-muted)]">Entrar</div>
              </div>
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-3 text-center">
                <div className="text-xs font-semibold text-[var(--color-git-text)]">2</div>
                <div className="mt-1 text-[11px] text-[var(--color-git-muted)]">Validar</div>
              </div>
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-3 text-center">
                <div className="text-xs font-semibold text-[var(--color-git-text)]">3</div>
                <div className="mt-1 text-[11px] text-[var(--color-git-muted)]">Participar</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Entrar agora</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">
                Se quiser testar rápido, o modo demonstração é o caminho mais simples.
              </p>
            </div>
            <div className="rounded-full border border-[rgba(63,185,80,0.28)] bg-[rgba(63,185,80,0.08)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-git-green)]">
              recomendado
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <button
              onClick={() => void handleConnect('demo')}
              disabled={isConnecting}
              className="group flex w-full items-center justify-between rounded-[24px] border border-[rgba(88,166,255,0.28)] bg-[rgba(88,166,255,0.08)] px-4 py-4 text-left transition-colors hover:border-[rgba(88,166,255,0.44)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(88,166,255,0.26)] bg-[rgba(88,166,255,0.14)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-git-blue)]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--color-git-text)]">Entrar no alpha local</div>
                  <div className="text-xs text-[var(--color-git-muted)]">Acesso imediato para explorar o fluxo</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-git-muted)] transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => void handleConnect('wallet')}
              disabled={isConnecting}
              className="group flex w-full items-center justify-between rounded-[24px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-left transition-colors hover:border-[rgba(255,255,255,0.2)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(246,133,27,0.26)] bg-[rgba(246,133,27,0.12)]">
                  <Wallet className="h-5 w-5 text-[#F6851B]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--color-git-text)]">Conectar MetaMask</div>
                  <div className="text-xs text-[var(--color-git-muted)]">Usar sua própria carteira para continuar</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-git-muted)] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {isConnecting ? (
            <p className="mt-4 text-sm text-[var(--color-git-muted)]">Preparando seu acesso...</p>
          ) : null}
          {error ? <p className="mt-4 text-sm text-[var(--color-git-red)]">{error}</p> : null}
        </section>

        <div className="space-y-3">
          <StepItem
            icon={Wallet}
            title="1. Entre"
            description="Abra uma sessão local ou conecte sua carteira."
          />
          <StepItem
            icon={MapPin}
            title="2. Valide seu endereço"
            description="Escolha seu bairro e envie um comprovante para liberar participação."
          />
          <StepItem
            icon={Vote}
            title="3. Vote e acompanhe"
            description="Depois da validação, você acessa propostas, leis e atividade local."
          />
        </div>

      </div>
    </motion.div>
  );
}
