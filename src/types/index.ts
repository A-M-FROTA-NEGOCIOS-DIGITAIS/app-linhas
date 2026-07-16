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

export type ReadingType = 'master' | 'daily' | 'themed' | 'compatibility' | 'core'
export type Gender = 'male' | 'female' | 'neutral'
export type ProdutoAlma =
  | 'leitura_core'
  | 'mestra'
  | 'ritual'
  | 'compatibilidade'
  | 'quem_ama'
  | '12meses'
  | 'outra_mao'
  | 'downsell'
  | 'audio'
  | 'sentenca'
  | 'despertar'

export const PRODUTOS_ESTANTE: { produto: ProdutoAlma; nome: string }[] = [
  { produto: 'mestra', nome: 'Leitura Mestra' },
  { produto: 'ritual', nome: 'Ritual de Ruptura' },
  { produto: 'compatibilidade', nome: 'Compatibilidade' },
  { produto: 'quem_ama', nome: 'Quem Te Ama' },
  { produto: '12meses', nome: 'O Seu Ano Interior' },
  { produto: 'outra_mao', nome: 'Sua Outra Mão' },
  { produto: 'downsell', nome: 'A Marca da Vida' },
  { produto: 'audio', nome: 'Áudio com Madame Aurora' },
  { produto: 'sentenca', nome: 'A Sentença' },
]

export interface Capitulo {
  numero: number
  titulo: string
  conteudo: string
}

export interface Compra {
  id: string
  user_id: string
  produto: ProdutoAlma
  status: string
  valor_brl?: number
  created_at: string
}

export interface Assinatura {
  id: string
  user_id: string
  status: 'ativa' | 'cancelada' | 'inadimplente'
  bluen_sub_id: string
  ultima_releitura?: string
  proxima_releitura?: string
  proxima_cobranca?: string
}

export interface Releitura {
  id: string
  user_id: string
  capitulos?: Capitulo[]
  full_content?: string
  created_at: string
}

export interface Profile {
  id: string
  name: string
  date_of_birth?: string
  time_of_birth?: string
  city_of_birth?: string
  gender?: Gender
  intention?: Intention
  subscription_status: SubscriptionStatus
  marca_adormecida?: string
  bluen_customer_id?: string
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
  sessao_id?: string
  reading_type: ReadingType
  produto?: ProdutoAlma
  theme?: string
  full_content?: string
  preview_content?: string
  capitulos?: Capitulo[]
  qualidade_aprovada?: boolean
  word_count?: number
  audio_url?: string
  imagem_url?: string
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
