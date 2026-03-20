import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, MapPinned, User, Vote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { to: '/',         icon: Home,      label: 'Início',    end: true  },
  { to: '/meu-bairro', icon: MapPinned, label: 'Bairro',  end: false },
  { to: '/propostas',  icon: Vote,     label: 'Propostas', end: false },
  { to: '/leis',       icon: BookOpen, label: 'Leis',      end: false },
  { to: '/perfil',     icon: User,     label: 'Perfil',    end: false },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav pb-safe">
      {/* top shimmer line */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(56,189,248,0.3) 40%, rgba(192,132,252,0.3) 60%, transparent)',
        }}
      />

      <div className="mx-auto flex h-[68px] max-w-md items-center justify-around px-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors duration-200',
                isActive
                  ? 'text-[var(--color-git-blue)]'
                  : 'text-[var(--color-git-muted)] hover:text-[var(--color-git-text2)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-x-1 top-2 bottom-1 rounded-2xl"
                      style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.14)' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  whileTap={{ scale: 0.78 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-all duration-200',
                      isActive && 'icon-glow-blue',
                    )}
                  />
                  {/* dot indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-git-blue)]"
                        style={{ boxShadow: '0 0 6px var(--color-git-blue-glow)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'relative z-10 text-[9px] font-semibold uppercase tracking-[0.12em] transition-all duration-200',
                    isActive
                      ? 'text-[var(--color-git-blue)]'
                      : 'text-[var(--color-git-muted)]',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
