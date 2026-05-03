import React, { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth, loading, className, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-sans text-sm font-medium tracking-tight rounded-md transition-all duration-300 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/40 disabled:opacity-45 disabled:cursor-not-allowed select-none'
    const variants = {
      primary:   'bg-accent-gold text-bg-primary border border-accent-gold hover:bg-accent-gold-deep hover:border-accent-gold-deep active:opacity-80',
      secondary: 'bg-transparent text-accent-gold border border-accent-gold hover:bg-accent-gold/10 active:opacity-80',
      ghost:     'bg-transparent text-text-secondary border border-transparent hover:text-text-primary active:opacity-80',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], fullWidth && 'w-full', 'py-[14px] px-6', className)}
        {...props}
      >
        {loading ? <Spinner size={16} /> : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ── Field ─────────────────────────────────────────────────────────────────────
interface FieldProps {
  label?: string
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
  required?: boolean
}

export function Field({ label, value, onChange, placeholder, type = 'text', error, required }: FieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Eyebrow>{label}{required && <span className="text-accent-gold ml-1">*</span>}</Eyebrow>}
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'bg-bg-surface rounded-md px-4 py-[14px] text-base text-text-primary font-sans outline-none transition-all duration-300',
          'border placeholder:text-text-muted',
          error
            ? 'border-status-error/70'
            : focused
            ? 'border-accent-gold shadow-[0_0_0_2px_rgba(201,169,97,0.18)]'
            : 'border-border-subtle',
        )}
      />
      {error && <p className="text-xs text-status-error/80">{error}</p>}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  goldBorder?: boolean
}

export function Card({ children, onClick, className, goldBorder }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-bg-surface rounded-md border transition-all duration-300',
        goldBorder ? 'border-accent-gold/50' : 'border-border-subtle hover:border-border-medium',
        onClick && 'cursor-pointer active:opacity-80',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Eyebrow ───────────────────────────────────────────────────────────────────
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-xs font-medium tracking-widest uppercase text-accent-gold font-sans', className)}>
      {children}
    </div>
  )
}

// ── Hairline ──────────────────────────────────────────────────────────────────
export function Hairline({ gold, className }: { gold?: boolean; className?: string }) {
  return (
    <hr
      className={cn(
        'border-0 h-px',
        gold ? 'bg-accent-gold/60' : 'bg-border-subtle',
        className,
      )}
    />
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  )
}

// ── Chip ──────────────────────────────────────────────────────────────────────
interface ChipProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}

export function Chip({ children, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs font-sans tracking-wide px-3 py-1.5 rounded-pill border transition-all duration-300',
        active
          ? 'border-accent-gold text-accent-gold'
          : 'border-border-subtle text-text-secondary',
      )}
    >
      {children}
    </button>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────
interface TopBarProps {
  title?: string
  onBack?: () => void
  right?: React.ReactNode
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 min-h-[48px]">
      {onBack && (
        <button onClick={onBack} className="text-text-secondary active:text-text-primary transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      {title && (
        <div className="flex-1 text-xs font-medium tracking-widest uppercase text-text-secondary font-sans">
          {title}
        </div>
      )}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}

// ── TabBar ────────────────────────────────────────────────────────────────────
type TabId = 'today' | 'readings' | 'aurora' | 'you'

const TABS: { id: TabId; label: string; icon: React.FC<{ size?: number }> }[] = [
  {
    id: 'today', label: 'Today',
    icon: ({ size = 22 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </svg>
    ),
  },
  {
    id: 'readings', label: 'Readings',
    icon: ({ size = 22 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'aurora', label: 'Aurora',
    icon: ({ size = 22 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01z" />
      </svg>
    ),
  },
  {
    id: 'you', label: 'You',
    icon: ({ size = 22 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

interface TabBarProps {
  active: TabId
  onChange: (t: TabId) => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="absolute left-3 right-3 bottom-3 bg-bg-primary/80 backdrop-blur-xl border border-border-subtle rounded-[28px] px-2 py-3 flex justify-around z-10">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-300',
              isActive ? 'text-accent-gold' : 'text-text-secondary',
            )}
          >
            <Icon size={22} />
            <span className="text-[9px] font-sans tracking-[0.16em] uppercase">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string
  type?: 'default' | 'error'
  onDismiss?: () => void
}

export function Toast({ message, type = 'default', onDismiss }: ToastProps) {
  React.useEffect(() => {
    const t = setTimeout(() => onDismiss?.(), 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-md border text-sm font-sans animate-fade-up',
        type === 'error'
          ? 'bg-status-error/20 border-status-error/40 text-text-primary'
          : 'bg-bg-elevated border-border-subtle text-text-primary',
      )}
    >
      {message}
    </div>
  )
}

// ── utils ─────────────────────────────────────────────────────────────────────
export { cn }
