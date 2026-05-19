import { useState } from 'react'
import { Button, Eyebrow, Hairline } from '@/components/ui'
import { track, Events } from '@/lib/analytics'

interface Props {
  preview: string
  name: string
  onSubscribe: (plan: 'monthly' | 'yearly') => void
  onSkip?: () => void
}

const FEATURES = [
  'Full master reading (1,000+ words)',
  'Daily personalized insight',
  'Monthly re-scan',
  'AI Chat with Madame Aurora 24/7',
  "Compatibility — scan someone else's hand",
]

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
  </svg>
)

export function Paywall({ preview, name, onSubscribe, onSkip }: Props) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly')

  const handleSubscribe = () => {
    track(Events.TRIAL_STARTED, { plan, amount_cents: plan === 'monthly' ? 1990 : 14900 })
    onSubscribe(plan)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview with fade */}
      <div className="relative px-6 pt-10 pb-2" style={{ maxHeight: '34%' }}>
        <Eyebrow className="mb-4">Your reading</Eyebrow>
        <div className="relative overflow-hidden" style={{ maxHeight: 180 }}>
          <p className="reading-text text-sm leading-relaxed line-clamp-6">
            {preview || `${name}, your hands reveal a pattern most people never see…`}
          </p>
          {/* Fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24"
            style={{ background: 'linear-gradient(transparent, var(--bg-primary))' }} />
        </div>
        {/* Lock badge */}
        <div className="flex items-center gap-2 mt-2 text-text-secondary text-xs">
          <LockIcon />
          <span>Your full reading has 1,000+ words — unlock it below.</span>
        </div>
        {/* Reading stats */}
        <p className="text-xs mt-3" style={{ color: 'var(--accent-gold)', letterSpacing: '0.01em' }}>
          1,000 words · 4 lines · 8 mounts · personalized reading
        </p>
      </div>

      <Hairline className="mx-6 mt-2" />

      {/* Plan selector + CTA */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6 scroll-area gap-4">
        {/* Features */}
        <div className="flex flex-col gap-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3 text-sm text-text-primary">
              <span className="mt-0.5 flex-shrink-0"><CheckIcon /></span>
              {f}
            </div>
          ))}
        </div>

        <Hairline />

        {/* Plan options */}
        <div className="flex flex-col gap-3">
          {/* Yearly — recommended */}
          <button
            onClick={() => setPlan('yearly')}
            className={`relative w-full text-left px-5 py-4 rounded-md border transition-all duration-300 ${
              plan === 'yearly' ? 'border-accent-gold bg-accent-gold/5' : 'border-border-subtle bg-bg-surface'
            }`}
          >
            {plan === 'yearly' && (
              <div className="absolute -top-2.5 right-4 bg-accent-gold text-bg-primary text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full">
                Best value
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-text-primary">Annual plan</div>
                <div className="text-xs text-text-secondary mt-0.5">37% off · 3-day free trial</div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>$39.99</div>
                <div className="text-[10px] text-text-muted">per year</div>
              </div>
            </div>
          </button>

          {/* Monthly */}
          <button
            onClick={() => setPlan('monthly')}
            className={`w-full text-left px-5 py-4 rounded-md border transition-all duration-300 ${
              plan === 'monthly' ? 'border-accent-gold bg-accent-gold/5' : 'border-border-subtle bg-bg-surface'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-text-primary">Monthly plan</div>
                <div className="text-xs text-text-secondary mt-0.5">3-day free trial</div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>$4.99</div>
                <div className="text-[10px] text-text-muted">per month</div>
              </div>
            </div>
          </button>
        </div>

        <Button variant="primary" fullWidth onClick={handleSubscribe}>
          Start 3-day free trial
        </Button>

        <p className="text-xs text-text-muted text-center">
          Cancel anytime. No ads, ever.
        </p>

        {onSkip && (
          <button className="text-xs text-text-muted underline underline-offset-2 text-center" onClick={onSkip}>
            Maybe later
          </button>
        )}
      </div>
    </div>
  )
}
