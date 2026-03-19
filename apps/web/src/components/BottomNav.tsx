import { NavLink } from 'react-router-dom';
import { Home, BookOpen, MapPinned, User, Vote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/meu-bairro', icon: MapPinned, label: 'Meu Bairro' },
    { to: '/propostas', icon: Vote, label: 'Propostas' },
    { to: '/leis', icon: BookOpen, label: 'Leis' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-git-border)] bg-[#05080f]/70 backdrop-blur-2xl pb-safe">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex h-full w-full flex-col items-center justify-center gap-1.5 transition-colors',
                isActive
                  ? 'text-[var(--color-git-blue)]'
                  : 'text-[var(--color-git-muted)] hover:text-[var(--color-git-text)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={cn(
                    "relative flex items-center justify-center rounded-xl p-2",
                    isActive ? "bg-[var(--color-git-blue)]/10 text-[var(--color-git-blue)]" : "text-[var(--color-git-muted)]"
                  )}
                >
                  <Icon className={cn("w-[22px] h-[22px]", isActive && "drop-shadow-[0_0_8px_var(--color-git-blue)]")} />
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-1 w-1 h-1 rounded-full bg-[var(--color-git-blue)] drop-shadow-[0_0_4px_var(--color-git-blue)]"
                    />
                  )}
                </motion.div>
                <span className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive && "drop-shadow-[0_0_4px_var(--color-git-blue-glow)]"
                )}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
