import { Outlet, Link, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ShieldCheck, Wallet } from 'lucide-react';
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
    <div className="flex min-h-screen justify-center bg-[#030509]">
      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-[var(--color-git-border)] bg-[var(--color-git-bg)] shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* Animated Background Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[40%] bg-[radial-gradient(ellipse_at_center,_var(--color-git-blue-glow),_transparent_60%)] opacity-40 blur-[80px] animate-[blob_8s_infinite]" />
          <div className="absolute top-[40%] right-[-20%] w-[60%] h-[50%] bg-[radial-gradient(ellipse_at_center,_var(--color-git-purple-glow),_transparent_60%)] opacity-30 blur-[80px] animate-[blob_10s_infinite_reverse]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[80%] h-[40%] bg-[radial-gradient(ellipse_at_center,_var(--color-git-green-glow),_transparent_60%)] opacity-20 blur-[80px] animate-[blob_12s_infinite]" />
        </div>

        <header className="sticky top-0 z-40 border-b border-[var(--color-git-border)] bg-black/40 px-4 py-3 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="min-w-0 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[var(--color-git-blue)] to-[var(--color-git-purple)] p-[1px]">
                <div className="w-full h-full bg-[var(--color-git-bg)] rounded-[5px] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--color-git-text)]">GL</span>
                </div>
              </div>
              <h1 className="text-lg font-bold leading-none tracking-tight text-[var(--color-git-text)]">GitLaw</h1>
            </Link>

            <Link
              to={accountHref}
              className="group flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-[var(--color-git-text)] transition-all hover:border-[var(--color-git-blue)] hover:bg-white/[0.08] hover:shadow-[0_0_12px_var(--color-git-blue-glow)]"
            >
              {currentCitizen ? (
                <ShieldCheck className="h-4 w-4 text-[var(--color-git-green)] group-hover:drop-shadow-[0_0_8px_var(--color-git-green)]" />
              ) : (
                <Wallet className="h-4 w-4 text-[var(--color-git-blue)] group-hover:drop-shadow-[0_0_8px_var(--color-git-blue)]" />
              )}
              <span className="max-w-[9rem] truncate">{accountLabel}</span>
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {!hideBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
