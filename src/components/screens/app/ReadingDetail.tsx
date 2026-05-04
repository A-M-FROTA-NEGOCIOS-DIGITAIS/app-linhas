import { TopBar, Eyebrow, Hairline } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { Reading } from '@/types'

interface Props {
  reading: Reading
  onBack: () => void
}

const TYPE_LABELS: Record<string, string> = {
  master: 'Master reading',
  daily: 'Daily insight',
  themed: 'Themed reading',
  compatibility: 'Compatibility reading',
}

const SECTION_DIVIDER = /\n{2,}/

export function ReadingDetail({ reading, onBack }: Props) {
  const paragraphs = ((reading.full_content ?? reading.preview_content) || '')
    .split(SECTION_DIVIDER)
    .filter((p: string) => p.trim().length > 0)

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title={TYPE_LABELS[reading.reading_type] ?? 'Reading'}
        onBack={onBack}
      />

      <div className="flex-1 scroll-area px-6 pt-4 pb-16">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <Eyebrow>{TYPE_LABELS[reading.reading_type] ?? reading.reading_type}</Eyebrow>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-[11px] text-text-muted uppercase tracking-wider">{formatDate(reading.created_at)}</span>
        </div>

        <Hairline className="mb-8" />

        {/* Body in reading typography */}
        <div className="flex flex-col gap-6">
          {paragraphs.map((para, i) => {
            // Detect section headers (lines ending with : or all-caps short lines)
            const isHeader = para.trim().length < 60 && (para.trim().endsWith(':') || para.trim() === para.trim().toUpperCase())
            if (isHeader) {
              return (
                <Eyebrow key={i} className="mt-2">
                  {para.replace(/:$/, '')}
                </Eyebrow>
              )
            }
            return (
              <p
                key={i}
                className="reading-text"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  lineHeight: 1.75,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.005em',
                }}
              >
                {para}
              </p>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 12px' }}>
            <path d="M4 24c6-12 18-12 24 0" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
            <path d="M7 24c4-8 14-8 18 0" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            <path d="M11 24c2-4 8-4 10 0" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
            <circle cx="16" cy="20" r="2" fill="#C9A961" opacity="0.4"/>
          </svg>
          <p className="text-xs text-text-muted tracking-widest uppercase">Linhas · Aurora</p>
        </div>
      </div>
    </div>
  )
}
