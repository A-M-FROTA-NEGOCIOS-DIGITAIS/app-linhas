import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY as string
const host = import.meta.env.VITE_POSTHOG_HOST as string

export function initAnalytics() {
  if (!key) return
  posthog.init(key, {
    api_host: host ?? 'https://app.posthog.com',
    capture_pageview: false,
    persistence: 'localStorage',
  })
}

export function identify(userId: string, props?: Record<string, unknown>) {
  posthog.identify(userId, props)
}

export function track(event: string, props?: Record<string, unknown>) {
  posthog.capture(event, props)
}

// Critical funnel events
export const Events = {
  ONBOARDING_STARTED:       'onboarding_started',
  INTENTION_SELECTED:       'intention_selected',
  PALM_SCAN_STARTED:        'palm_scan_started',
  PALM_SCAN_COMPLETED:      'palm_scan_completed',
  PALM_SCAN_FAILED:         'palm_scan_failed',
  READING_GENERATED:        'reading_generated',
  PAYWALL_VIEWED:           'paywall_viewed',
  TRIAL_STARTED:            'trial_started',
  SUBSCRIPTION_ACTIVATED:   'subscription_activated',
  SUBSCRIPTION_CANCELLED:   'subscription_cancelled',
  DAILY_INSIGHT_OPENED:     'daily_insight_opened',
  CHAT_MESSAGE_SENT:        'chat_message_sent',
  COMPAT_SCAN_STARTED:      'compat_scan_started',
  RESCAN_INITIATED:         'rescan_initiated',
} as const
