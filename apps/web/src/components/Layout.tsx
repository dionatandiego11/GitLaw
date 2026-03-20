import { Outlet, Link, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ShieldCheck, Wallet, Zap } from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { motion, AnimatePresence } from 'motion/react';

export function Layout() {
  const location = useLocation();
  const { currentAddress, currentCitizen } = useApp();

  const accountHref = currentCitizen
    ? '/perfil'
    : currentAddress
      ? '/cidadania/solicitar'
      : '/connect';

  const accountLabel = currentCitizen
    ? currentCitizen.bairroNome
    : currentAddress
      ? 'Validar residência'
      : 'Entrar';

  const hideBottomNav =
    /^\/propostas\/nova$/.test(location.pathname) ||
    /^\/propostas\/[^/]+(?:\/votar)?$/.test(location.pathname) ||
    /^\/pr\/[^/]+$/.test(location.pathname) ||
    /^\/leis\/[^/]+\/fork$/.test(location.pathname) ||
    /^\/fork\/novo$/.test(location.pathname);

  return (
    <div className="flex min-h-screen justify-center bg-[#020408]">
      {/* outer ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[120%] h-[60%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% -20%, rgba(56,189,248,0.07) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-[var(--color-git-border)] bg-[var(--color-git-bg)] shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        {/* ── Animated Background Blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute top-[-15%] left-[-25%] w-[80%] h-[50%] opacity-30 blur-[90px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(56,189,248,0.55), transparent 65%)',
              animation: 'blob 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[35%] right-[-25%] w-[70%] h-[55%] opacity-20 blur-[80px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(192,132,252,0.6), transparent 65%)',
              animation: 'blob 11s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[10%] w-[90%] h-[45%] opacity-15 blur-[100px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(52,211,153,0.5), transparent 65%)',
              animation: 'blob 13s ease-in-out infinite 2s',
            }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-grid opacity-40" />
        </div>

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 glass-header px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    boxShadow: '0 0 16px rgba(56,189,248,0.5), 0 4px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <Zap className="w-4 h-4 text-white" fill="white" />
                </div>
                {/* pulse ring */}
                <div
                  className="absolute inset-0 rounded-[10px] animate-pulse-glow"
                  style={{ boxShadow: '0 0 0 3px rgba(56,189,248,0.15)' }}
                />
              </div>
              <div>
                <h1 className="text-base font-bold leading-none tracking-tight text-[var(--color-git-text)] group-hover:gradient-text-blue transition-all">
                  GitLaw
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-git-muted)] leading-none mt-0.5">
                  alpha local
                </p>
              </div>
            </Link>

            {/* Account pill */}
            <Link
              to={accountHref}
              className="group flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-[var(--color-git-text2)] transition-all duration-300 hover:border-[rgba(56,189,248,0.4)] hover:bg-[rgba(56,189,248,0.06)] hover:shadow-[0_0_16px_rgba(56,189,248,0.15)]"
            >
              {currentCitizen ? (
                <>
                  <span className="status-dot status-dot-green" />
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-git-green)] icon-glow-green" />
                </>
              ) : (
                <Wallet className="h-3.5 w-3.5 text-[var(--color-git-blue)]" />
              )}
              <span className="max-w-[8rem] truncate">{accountLabel}</span>
            </Link>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
