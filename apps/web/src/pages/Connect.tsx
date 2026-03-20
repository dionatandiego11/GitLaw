import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Vote,
  Wallet,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

function StepItem({
  icon: Icon,
  title,
  description,
  index,
  done = false,
}: {
  icon: typeof Wallet;
  title: string;
  description: string;
  index: number;
  done?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-3 rounded-[20px] p-4"
      style={{
        background: done ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.025)',
        border: done ? '1px solid rgba(52,211,153,0.18)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
        style={{
          background: done ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.1)',
          border: done ? '1px solid rgba(52,211,153,0.28)' : '1px solid rgba(56,189,248,0.22)',
          color: done ? 'var(--color-git-green)' : 'var(--color-git-blue)',
        }}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[var(--color-git-text)] leading-snug">{title}</h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-git-muted2)]">{description}</p>
      </div>
      {done && <Icon className="w-4 h-4 shrink-0 text-[var(--color-git-green)] mt-0.5 icon-glow-green" />}
    </motion.div>
  );
}

export function Connect() {
  const navigate = useNavigate();
  const { connectWallet, connectDemoWallet } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBtn, setActiveBtn] = useState<'demo' | 'wallet' | null>(null);

  const handleConnect = async (mode: 'wallet' | 'demo') => {
    setIsConnecting(true);
    setActiveBtn(mode);
    setError(null);
    try {
      const session = mode === 'wallet' ? await connectWallet() : await connectDemoWallet();
      navigate(session.citizen ? '/' : '/cidadania/solicitar');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível iniciar sua sessão agora.');
    } finally {
      setIsConnecting(false);
      setActiveBtn(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-git-bg)] px-4 py-8 overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] opacity-25 blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.7), transparent 65%)', animation: 'blob 10s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[45%] opacity-20 blur-[90px]"
          style={{ background: 'radial-gradient(ellipse, rgba(192,132,252,0.7), transparent 65%)', animation: 'blob 12s ease-in-out infinite reverse' }}
        />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <motion.div
        className="relative mx-auto flex w-full max-w-md flex-col gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Hero Card ── */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-[28px] p-px"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.4), rgba(129,140,248,0.25), rgba(255,255,255,0.05))' }}
        >
          <div
            className="relative rounded-[27px] p-6 overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(56,189,248,0.1) 0%, rgba(8,13,26,0.99) 50%)',
            }}
          >
            {/* Noise texture */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[27px] opacity-30"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'repeat',
                backgroundSize: '128px',
              }}
            />

            {/* Logo badge */}
            <div className="relative flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  boxShadow: '0 0 32px rgba(56,189,248,0.5), 0 8px 20px rgba(0,0,0,0.5)',
                }}
              >
                <Zap className="w-7 h-7 text-white" fill="white" />
              </motion.div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(230,237,243,0.55)]">
                  Bem-vindo ao
                </p>
                <h1 className="text-2xl font-bold leading-tight gradient-text-blue">
                  GitLaw Alpha
                </h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[rgba(230,237,243,0.72)] mb-4">
              Democracia direta onde leis funcionam como código. Proponha, vote, debata — e faça forks das normas do seu bairro.
            </p>

            {/* Journey pills */}
            <div className="grid grid-cols-3 gap-2">
              {['1 · Entrar', '2 · Validar', '3 · Participar'].map((step, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-2.5 text-center"
                  style={{
                    background: i === 0 ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                    border: i === 0 ? '1px solid rgba(56,189,248,0.28)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="text-[10px] font-bold tracking-wide" style={{ color: i === 0 ? 'var(--color-git-blue)' : 'var(--color-git-muted)' }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Login Buttons ── */}
        <motion.section
          variants={itemVariants}
          className="rounded-[24px] p-5"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--color-git-text)]">Entrar agora</h2>
              <p className="text-xs text-[var(--color-git-muted2)] mt-0.5">
                Modo demonstração é o mais rápido para explorar.
              </p>
            </div>
            <span className="chip-green">recomendado</span>
          </div>

          <div className="space-y-3">
            {/* Demo button */}
            <motion.button
              onClick={() => void handleConnect('demo')}
              disabled={isConnecting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="group relative w-full overflow-hidden rounded-[18px] p-px transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.5), rgba(129,140,248,0.3))' }}
            >
              <div
                className="relative flex items-center justify-between gap-3 rounded-[17px] px-4 py-3.5 transition-all group-hover:bg-[rgba(56,189,248,0.05)]"
                style={{ background: 'linear-gradient(160deg, rgba(56,189,248,0.1) 0%, rgba(4,6,13,1) 60%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.18)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <ShieldCheck className="w-5 h-5 text-[var(--color-git-blue)] icon-glow-blue" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[var(--color-git-text)]">
                      {activeBtn === 'demo' ? 'Iniciando sessão…' : 'Entrar no alpha local'}
                    </div>
                    <div className="text-xs text-[var(--color-git-muted2)]">Acesso imediato sem carteira</div>
                  </div>
                </div>
                <motion.div animate={activeBtn === 'demo' ? { x: [0, 4, 0] } : {}} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <ArrowRight className="h-4 w-4 text-[var(--color-git-blue)]" />
                </motion.div>
              </div>
            </motion.button>

            {/* Wallet button */}
            <motion.button
              onClick={() => void handleConnect('wallet')}
              disabled={isConnecting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="group w-full overflow-hidden rounded-[18px] transition-all disabled:opacity-60"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 group-hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(246,133,27,0.14)', border: '1px solid rgba(246,133,27,0.25)' }}>
                    <Wallet className="w-5 h-5 text-[#F6851B]" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[var(--color-git-text)]">
                      {activeBtn === 'wallet' ? 'Aguardando assinatura…' : 'Conectar MetaMask'}
                    </div>
                    <div className="text-xs text-[var(--color-git-muted2)]">Carteira real com assinatura de sessão</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-git-muted)] group-hover:text-[var(--color-git-text)] transition-colors" />
              </div>
            </motion.button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-[var(--color-git-red)] bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] rounded-[14px] px-3 py-2"
            >
              {error}
            </motion.p>
          )}
        </motion.section>

        {/* ── Steps ── */}
        <motion.div variants={containerVariants} className="space-y-2">
          <StepItem icon={Wallet}   title="1. Entre"               description="Abra uma sessão local ou conecte sua carteira." index={0} />
          <StepItem icon={MapPin}   title="2. Valide seu endereço"  description="Escolha seu bairro e envie um comprovante para liberar participação." index={1} />
          <StepItem icon={Vote}     title="3. Vote e acompanhe"     description="Depois da validação, você acessa propostas, leis e atividade local." index={2} />
        </motion.div>
      </motion.div>
    </div>
  );
}
