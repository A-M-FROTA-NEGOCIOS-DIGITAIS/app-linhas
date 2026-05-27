export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'expired'
export type HandType = 'dominant' | 'non_dominant'
export type HandShape = 'earth' | 'air' | 'fire' | 'water'
export type Intention =
  | 'love_patterns'
  | 'life_purpose'
  | 'career_money'
  | 'whats_coming'
  | 'repeating_cycles'
  | 'everything'

export type ReadingType = 'master' | 'daily' | 'themed' | 'compatibility'
export type Gender = 'male' | 'female' | 'neutral'

export interface Profile {
  id: string
  name: string
  date_of_birth?: string
  time_of_birth?: string
  city_of_birth?: string
  gender?: Gender
  intention?: Intention
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface PalmScan {
  id: string
  user_id: string
  hand_type: HandType
  image_url: string
  analysis?: PalmAnalysis
  created_at: string
}

export interface PalmAnalysis {
  hand_shape: HandShape
  dominant_hand?: boolean
  image_quality?: string
  is_palm?: boolean
  main_lines: {
    life_line?: PalmLine & { length?: string; depth?: string }
    heart_line?: PalmLine & { length?: string; depth?: string }
    head_line?: PalmLine & { length?: string; depth?: string }
    fate_line?: { present?: boolean; length?: string; characteristic?: string; interpretation?: string }
  }
  mounts?: Record<string, string>
  special_marks?: string[]
  overall_character?: string
  error?: string
}

export interface PalmLine {
  characteristic?: string
  interpretation?: string
}

export interface Reading {
  id: string
  user_id: string
  scan_id?: string
  reading_type: ReadingType
  theme?: string
  full_content?: string
  preview_content?: string
  word_count?: number
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
}
