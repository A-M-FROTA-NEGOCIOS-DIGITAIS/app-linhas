import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth, loading, className, children, disabled, ...props }, ref) => {
    // Visual aurora: primário = pílula dourada com brilho passando (.alma-btn);
    // secundário = contorno dourado (.alma-btn-secondary); ghost = texto discreto.
    const variants = {
      primary: 'alma-btn',
      secondary: 'alma-btn-secondary px-6',
      ghost: 'inline-flex items-center justify-center gap-2 h-12 px-4 rounded-pill bg-transparent border border-transparent font-sans text-[15px] text-text-secondary hover:text-text-primary',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          variants[variant],
          variant !== 'primary' && fullWidth && 'w-full',
          variant === 'primary' && !fullWidth && 'w-auto px-8',
          'select-none transition-all duration-300 disabled:opacity-45 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size={18} /> : variant === 'primary' ? <span className="inline-flex items-center gap-2.5">{children}</span> : children}
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
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Eyebrow>{label}{required && <span className="text-accent ml-1">*</span>}</Eyebrow>}
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn('alma-input w-full', error && '!border-status-error/70')}
      />
      {error && <p className="text-xs text-status-error">{error}</p>}
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
        'alma-glass transition-all duration-300',
        goldBorder ? '!border-[rgba(242,200,121,0.35)]' : 'hover:border-border-medium',
        onClick && 'cursor-pointer hover:-translate-y-0.5 active:opacity-80',
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
    <div className={cn('alma-eyebrow', className)}>
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
        gold ? 'bg-accent/60' : 'bg-border-subtle',
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
    <button type="button" onClick={onClick} aria-pressed={!!active} className="alma-chip">
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
        <button onClick={onBack} aria-label="Voltar" className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-gold-text hover:bg-white/5 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      {title && (
        <div className="flex-1 alma-label">
          {title}
        </div>
      )}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}

// ── TabBar ────────────────────────────────────────────────────────────────────
export interface TabDef {
  id: string
  label: string
  icon: React.FC<{ size?: number }>
}

// Ícones prontos reaproveitáveis por qualquer tela que monte seu próprio TabBar
export const TabBarIcons = {
  today: ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  readings: ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 5.5c3-1.2 6.5-1 10 1.2 3.5-2.2 7-2.4 10-1.2V19c-3-1.2-6.5-1-10 1.2C8.5 18 5 17.8 2 19z" /><path d="M12 6.7v13.5" />
    </svg>
  ),
  aurora: ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
    </svg>
  ),
  you: ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  grid: ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  ),
}

const ABAS_PADRAO: TabDef[] = [
  { id: 'today', label: 'Today', icon: TabBarIcons.today },
  { id: 'readings', label: 'Readings', icon: TabBarIcons.readings },
  { id: 'aurora', label: 'Aurora', icon: TabBarIcons.aurora },
  { id: 'you', label: 'You', icon: TabBarIcons.you },
]

interface TabBarProps {
  active: string
  onChange: (t: string) => void
  tabs?: TabDef[]
}

export function TabBar({ active, onChange, tabs }: TabBarProps) {
  const { t } = useTranslation()
  const resolvedTabs = tabs ?? ABAS_PADRAO.map((tab) => ({
    ...tab,
    label: t(`tabBar.${tab.id}`),
  }))
  return (
    <nav aria-label="Navegação principal" className="alma-tabbar" style={{ ['--abas' as string]: resolvedTabs.length }}>
      {resolvedTabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
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
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-pill border text-sm font-sans animate-fade-up backdrop-blur-xl',
        type === 'error'
          ? 'bg-[rgba(255,157,176,0.15)] border-[rgba(255,157,176,0.45)] text-text-primary'
          : 'bg-[rgba(12,16,49,0.85)] border-[rgba(242,200,121,0.35)] text-text-primary',
      )}
    >
      {message}
    </div>
  )
}

// ── utils ─────────────────────────────────────────────────────────────────────
export { cn }

// ── BotaoVoltar ───────────────────────────────────────────────────────────────
/** Seta de voltar das telas do fluxo (referências L02–L06). */
export function BotaoVoltar({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('common.back')}
      className={cn('w-11 h-11 -ml-2.5 flex items-center justify-center flex-shrink-0', className)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9C3DD" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </button>
  )
}

/** Seta → do botão dourado. Os textos antigos que terminam em "→" usam semSeta(). */
export function SetaCta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export const semSeta = (texto: string) => texto.replace(/\s*→\s*$/, '')
