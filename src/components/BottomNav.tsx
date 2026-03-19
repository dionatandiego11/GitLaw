import { NavLink } from 'react-router-dom';
import { Home, BookOpen, MapPinned, User, Vote } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/meu-bairro', icon: MapPinned, label: 'Meu Bairro' },
    { to: '/propostas', icon: Vote, label: 'Propostas' },
    { to: '/leis', icon: BookOpen, label: 'Leis' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-git-border)] bg-[rgba(13,17,23,0.92)] backdrop-blur-xl pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-[var(--color-git-blue)]'
                  : 'text-[var(--color-git-muted)] hover:text-[var(--color-git-text)]',
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
