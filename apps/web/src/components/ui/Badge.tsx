import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'outline' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--color-git-bg3)] text-[var(--color-git-text)] border-[var(--color-git-border2)]',
    info: 'bg-[rgba(88,166,255,0.06)] text-[var(--color-git-blue)] border-[rgba(88,166,255,0.3)]',
    success: 'bg-[rgba(63,185,80,0.06)] text-[var(--color-git-green)] border-[rgba(63,185,80,0.3)]',
    warning: 'bg-[rgba(210,153,34,0.06)] text-[var(--color-git-amber)] border-[rgba(210,153,34,0.3)]',
    danger: 'bg-[rgba(248,81,73,0.06)] text-[var(--color-git-red)] border-[rgba(248,81,73,0.3)]',
    purple: 'bg-[rgba(188,140,255,0.06)] text-[var(--color-git-purple)] border-[rgba(188,140,255,0.3)]',
    outline: 'bg-transparent text-[var(--color-git-muted)] border-[var(--color-git-border2)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
