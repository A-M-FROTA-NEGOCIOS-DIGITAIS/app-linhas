import { Button } from '@/components/ui'

interface Props { name: string; onReadNow: () => void; onSetupPush: () => void }

export function Welcome({ name, onReadNow, onSetupPush }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-8"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.06), transparent 55%)' }}>
      {/* Chapter number */}
      <div className="text-center">
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 96, fontWeight: 300, color: 'var(--accent-gold)', lineHeight: 1, opacity: 0.85, letterSpacing: '-0.02em' }}>09</p>
        <p className="text-xs text-text-muted tracking-widest uppercase mt-2">Welcome</p>
      </div>

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
