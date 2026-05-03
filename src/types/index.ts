export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
export type HandType = 'dominant' | 'non_dominant'
export type HandShape = 'earth' | 'air' | 'fire' | 'water'
export type Intention =
  | 'love_patterns'
  | 'life_purpose'
  | 'career_money'
  | 'whats_coming'
  | 'repeating_cycles'
  | 'everything'

export type ReadingType = 'master' | 'daily_insight' | 'line_focus' | 'compatibility' | 'themed'

export interface Profile {
  id: string
  name: string
  email: string
  birth_date?: string
  birth_time?: string
  birth_city?: string
  zodiac_sign?: string
  intention?: Intention
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  onboarding_completed: boolean
  push_token?: string
  created_at: string
}

export interface PalmScan {
  id: string
  user_id: string
  hand_type: HandType
  image_url: string
  ai_analysis: PalmAnalysis
  hand_shape?: HandShape
  rarity_score?: number
  created_at: string
}

export interface PalmAnalysis {
  hand_shape: HandShape
  hand_shape_meaning: string
  main_lines: {
    life_line: PalmLine & { length: string; depth: string; breaks: boolean; branches: boolean }
    heart_line: PalmLine & { length: string; depth: string; breaks: boolean; branches: boolean; starts_at: string }
    head_line: PalmLine & { length: string; depth: string; connected_to_life_line: boolean }
    fate_line: { present: boolean; starts_at: string | null; characteristic: string; interpretation: string }
  }
  mounts: Record<string, 'underdeveloped' | 'normal' | 'developed'>
  fingers: {
    thumb_flexibility: 'rigid' | 'medium' | 'flexible'
    index_length: 'short' | 'medium' | 'long'
    middle_length: 'short' | 'medium' | 'long'
    ring_length: 'short' | 'medium' | 'long'
    pinky_length: 'short' | 'medium' | 'long'
  }
  notable_features: string[]
  rarity_score: number
  error?: string
}

export interface PalmLine {
  characteristic: string
  interpretation: string
}

export interface Reading {
  id: string
  user_id: string
  scan_id?: string
  reading_type: ReadingType
  theme?: string
  content: string
  preview_content?: string
  word_count?: number
  is_locked: boolean
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface DailyInsight {
  id: string
  user_id: string
  insight_text: string
  focused_line?: string
  scheduled_for: string
  delivered_at?: string
  opened_at?: string
}
