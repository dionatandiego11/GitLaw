import { Outlet, Link, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ShieldCheck, Wallet } from 'lucide-react';
import { useApp } from '@/context/AppProvider';

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
    <div className="flex min-h-screen justify-center bg-[#06080b]">
      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-[var(--color-git-border)] bg-[var(--color-git-bg)] shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,166,255,0.16),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(63,185,80,0.12),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_36%)]" />

        <header className="sticky top-0 z-40 border-b border-[var(--color-git-border)] bg-[rgba(13,17,23,0.88)] px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="min-w-0">
              <h1 className="text-lg font-semibold leading-none tracking-tight text-[var(--color-git-text)]">GitLaw</h1>
            </Link>

            <Link
              to={accountHref}
              className="flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[11px] font-medium text-[var(--color-git-text)] transition-colors hover:border-[rgba(88,166,255,0.5)]"
            >
              {currentCitizen ? (
                <ShieldCheck className="h-4 w-4 text-[var(--color-git-green)]" />
              ) : (
                <Wallet className="h-4 w-4 text-[var(--color-git-blue)]" />
              )}
              <span className="max-w-[9rem] truncate">{accountLabel}</span>
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        {!hideBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
