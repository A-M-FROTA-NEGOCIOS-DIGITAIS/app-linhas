import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, PalmScan, Reading, DailyInsight } from '@/types'

interface AppState {
  // Auth
  userId: string | null
  profile: Profile | null
  // Onboarding
  onboardingStep: number
  // Palm
  lastScan: PalmScan | null
  masterReading: Reading | null
  dailyInsight: DailyInsight | null
  // UI
  activeTab: 'today' | 'readings' | 'aurora' | 'you'

  // Actions
  setUserId: (id: string | null) => void
  setProfile: (p: Profile | null) => void
  setOnboardingStep: (s: number) => void
  setLastScan: (s: PalmScan | null) => void
  setMasterReading: (r: Reading | null) => void
  setDailyInsight: (d: DailyInsight | null) => void
  setActiveTab: (t: AppState['activeTab']) => void
  reset: () => void
}

const initial = {
  userId: null,
  profile: null,
  onboardingStep: 0,
  lastScan: null,
  masterReading: null,
  dailyInsight: null,
  activeTab: 'today' as const,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setUserId: (id) => set({ userId: id }),
      setProfile: (p) => set({ profile: p }),
      setOnboardingStep: (s) => set({ onboardingStep: s }),
      setLastScan: (s) => set({ lastScan: s }),
      setMasterReading: (r) => set({ masterReading: r }),
      setDailyInsight: (d) => set({ dailyInsight: d }),
      setActiveTab: (t) => set({ activeTab: t }),
      reset: () => set(initial),
    }),
    { name: 'linhas-store', partialize: (s) => ({ userId: s.userId, activeTab: s.activeTab }) }
  )
)
