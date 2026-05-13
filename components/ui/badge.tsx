import { cn } from '@/lib/utils'

type BadgeVariant = 'draft' | 'pending' | 'neutral' | 'info' | 'success' | 'danger' | 'primary' | 'warning'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  draft:   'bg-primary-dim border-primary-mid text-primary-text',
  primary: 'bg-primary-dim border-primary-mid text-primary-text',
  pending: 'bg-[rgba(217,48,37,0.08)] border-[rgba(217,48,37,0.2)] text-[#b02619]',
  danger:  'bg-[rgba(217,48,37,0.08)] border-[rgba(217,48,37,0.2)] text-[#b02619]',
  neutral: 'bg-[rgba(18,19,22,0.06)] border-[var(--gray3)] text-[var(--gray)]',
  info:    'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.2)] text-[#1d4ed8]',
  success: 'bg-[rgba(30,138,62,0.08)] border-[rgba(30,138,62,0.2)] text-[#166534]',
  warning: 'bg-[rgba(224,123,0,0.10)] border-[rgba(224,123,0,0.25)] text-[#92400e]',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap',
      'before:content-[""] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:opacity-60',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
