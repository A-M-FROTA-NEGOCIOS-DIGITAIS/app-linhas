import { Button } from '@/components/ui'

interface Props { name: string; onReadNow: () => void; onSetupPush: () => void }

export function Welcome({ name, onReadNow, onSetupPush }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-8"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.06), transparent 55%)' }}>
      {/* Glyph */}
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="30" stroke="#C9A961" strokeWidth="0.8" opacity="0.25"/>
        <path d="M14 50c10-18 34-18 44 0M18 50c8-14 28-14 36 0M24 50c4-8 20-8 24 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="36" cy="42" r="3" fill="#C9A961" opacity="0.7"/>
      </svg>

      <div className="text-center flex flex-col gap-3">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Welcome, {name}.
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Your master reading is ready.<br />Read it slowly — it was written for you.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <Button variant="primary" fullWidth onClick={onReadNow}>
          Read now
        </Button>
        <Button variant="secondary" fullWidth onClick={onSetupPush}>
          Set up daily insight
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center">
        Madame Aurora will send you a personalized insight every morning at 7 AM.
      </p>
    </div>
  )
}
