import { useState } from 'react'
import { TabBar } from '@/components/ui'
import { useAppStore } from '@/store/app'
import { Today } from './app/Today'
import { Readings } from './app/Readings'
import { AuroraChat } from './app/AuroraChat'
import { Profile } from './app/Profile'
import { ReadingDetail } from './app/ReadingDetail'
import { PalmScan } from './onboarding/PalmScan'
import { Scanning } from './onboarding/Scanning'
import type { Reading, PalmAnalysis } from '@/types'

type Tab = 'today' | 'readings' | 'aurora' | 'you'
type Overlay =
  | { type: 'reading-detail'; reading: Reading }
  | { type: 'rescan' }
  | { type: 'scanning'; imageDataUrl: string }
  | null

interface Props {
  onSignOut: () => void
}

export function AppShell({ onSignOut }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const profile = useAppStore((s) => s.profile)

  if (!profile) return null

  const handleOpenReading = (reading: Reading) => {
    setOverlay({ type: 'reading-detail', reading })
  }

  const handleReScan = () => {
    setOverlay({ type: 'rescan' })
  }

  const handleScanCapture = (imageDataUrl: string) => {
    setOverlay({ type: 'scanning', imageDataUrl })
  }

  const handleScanComplete = (_data: unknown) => {
    setOverlay(null)
    setActiveTab('today')
  }

  // Overlays take full screen priority
  if (overlay) {
    if (overlay.type === 'reading-detail') {
      return (
        <ReadingDetail
          reading={overlay.reading}
          onBack={() => setOverlay(null)}
        />
      )
    }
    if (overlay.type === 'rescan') {
      return (
        <div className="h-full flex flex-col">
          <button
            onClick={() => setOverlay(null)}
            className="absolute top-14 left-5 z-10 p-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <PalmScan onCapture={handleScanCapture} />
        </div>
      )
    }
    if (overlay.type === 'scanning') {
      return (
        <Scanning
          imageDataUrl={overlay.imageDataUrl}
          userId={profile.id}
          onComplete={handleScanComplete}
        />
      )
    }
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'today' && (
          <Today
            profile={profile}
            onOpenReading={() => {
              // open most recent master reading
            }}
            onOpenChat={() => setActiveTab('aurora')}
            onReScan={handleReScan}
          />
        )}
        {activeTab === 'readings' && (
          <Readings
            profile={profile}
            onOpenReading={handleOpenReading}
          />
        )}
        {activeTab === 'aurora' && (
          <AuroraChat profile={profile} />
        )}
        {activeTab === 'you' && (
          <Profile
            profile={profile}
            onReScan={handleReScan}
            onSignOut={onSignOut}
          />
        )}
      </div>

      <TabBar
        active={activeTab}
        onChange={(tab) => setActiveTab(tab as Tab)}
      />
    </div>
  )
}
