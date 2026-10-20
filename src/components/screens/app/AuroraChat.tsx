import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { AuroraAvatar, AuroraRetrato } from '@/components/ui/Aurora'
import { supabase } from '@/lib/supabase'
import { track, Events } from '@/lib/analytics'
import i18n from '@/lib/i18n'
import type { Profile, ChatMessage } from '@/types'

interface Props {
  profile: Profile
}

// Referência: app/reference/L12-Aurora — usuária em dourado (Jost, texto escuro),
// Aurora em vidro com borda dourada (Cormorant 19px).
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`} style={{ animation: 'alma-pop .4s ease-out both' }}>
      <div
        className="max-w-[82%] px-4 py-3"
        style={
          isUser
            ? { borderRadius: '20px 20px 6px 20px', background: 'linear-gradient(180deg, #FBE0A6, #E7B865 60%, #D9A54A)', color: '#2A1A05', boxShadow: '0 6px 20px rgba(242,180,90,.25)' }
            : { borderRadius: '20px 20px 20px 6px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(242,200,121,.25)', backdropFilter: 'blur(8px)', color: '#FBF4E4' }
        }
      >
        <p className="m-0" style={isUser ? { fontFamily: 'var(--font-ui)', fontSize: 15, lineHeight: 1.45 } : { fontFamily: 'var(--font-display)', fontSize: 19, lineHeight: 1.35 }}>
          {msg.content}
        </p>
        <p className="m-0 mt-1 text-right text-[10px]" style={{ color: isUser ? 'rgba(42,26,5,.6)' : '#8E89AE' }}>
          {new Date(msg.created_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="self-start flex gap-[5px] px-4 py-3.5" style={{ borderRadius: '20px 20px 20px 6px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(242,200,121,.25)' }}>
      {['#F2C879', '#F49AC1', '#9C86FF'].map((cor, i) => (
        <span key={cor} className="w-[7px] h-[7px] rounded-full" style={{ background: cor, animation: `alma-dot 1.2s ease-in-out infinite ${i * 0.15}s` }} />
      ))}
    </div>
  )
}

export function AuroraChat({ profile }: Props) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useFundo('aurora')

  const SUGGESTIONS = [t('aurora.s1'), t('aurora.s2'), t('aurora.s3'), t('aurora.s4'), t('aurora.s5')]
  const QUICK_REPLIES = [t('aurora.q1'), t('aurora.q2'), t('aurora.q3')]

  useEffect(() => {
    const safetyTimer = setTimeout(() => setLoading(false), 8000)
    const load = async () => {
      try {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: true })
          .limit(100)
        if (data) setMessages(data)
      } catch {
        // silent fail
      } finally {
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    }
    load()
    return () => clearTimeout(safetyTimer)
  }, [profile.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: profile.id,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)
    track(Events.CHAT_MESSAGE_SENT, { message_length: text.trim().length })

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-chat-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ user_id: profile.id, message: text.trim(), language: i18n.language }),
      })
      const data = await res.json()
      if (data.reply) {
        const auroraMsg: ChatMessage = {
          id: crypto.randomUUID(),
          user_id: profile.id,
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, auroraMsg])
      } else if (data.error) {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          user_id: profile.id,
          role: 'assistant',
          content: `⚠ ${data.error}`,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errMsg])
      }
    } catch (e) {
      console.error(e)
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: profile.id,
        role: 'assistant',
        content: t('aurora.connectionError'),
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const isEmpty = messages.length === 0 && !loading

  const status = t('aurora.status').replace(/^\s*●\s*/, '')

  return (
    <div className="h-full flex flex-col">
      {/* Cabeçalho: retrato com ponto verde pulsando */}
      <div className="flex items-center gap-3 px-5 pb-3.5 pt-[calc(26px+env(safe-area-inset-top,0px))]" style={{ background: 'linear-gradient(180deg, rgba(12,16,49,.95), rgba(12,16,49,0))' }}>
        <div className="relative flex-shrink-0">
          <AuroraAvatar tamanho={46} />
          <span className="absolute right-0 bottom-0 w-[11px] h-[11px] rounded-full" style={{ background: '#3FD6C2', border: '2px solid #0C1031', animation: 'alma-ping 1.6s ease-out infinite' }} />
        </div>
        <div>
          <h1 className="alma-display text-[22px] leading-none">{t('aurora.title')}</h1>
          <p className="m-0 mt-1 text-[12px] text-teal-text">{status}</p>
        </div>
      </div>

      <div className="flex-1 scroll-area px-[18px] py-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={24} className="text-gold" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <AuroraRetrato tamanho={112} />
              <p className="alma-label">Madame Aurora</p>
              <p className="alma-display text-center text-[24px] font-medium">
                {t('aurora.emptyTitle')}<br />
                <em className="text-[18px] text-text-secondary font-normal">{t('aurora.emptySubtitle')}</em>
              </p>
            </div>
            <div className="flex flex-col gap-2 pb-4">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="alma-option !min-h-0 !py-3 !text-[14px] text-text-secondary">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
            {sending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Sugestões roláveis + campo em pílula com borda dourada; fica acima da barra de abas */}
      <div className="flex flex-col gap-2.5 px-3.5 pt-2 pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
        {messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => send(reply)}
                disabled={sending}
                className="flex-shrink-0 h-[38px] px-3.5 rounded-pill text-[13px] text-[#EDE6D6] whitespace-nowrap hover:border-gold"
                style={{ border: '1px solid rgba(242,200,121,.35)', background: 'rgba(12,16,49,.7)', backdropFilter: 'blur(10px)' }}
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 min-h-14 py-1.5 pl-[18px] pr-1.5 rounded-[28px]" style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(242,200,121,.35)', backdropFilter: 'blur(12px)', boxShadow: '0 0 30px rgba(124,92,255,.2)' }}>
          <textarea
            ref={inputRef}
            value={input}
            aria-label={t('aurora.placeholder')}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px` }}
            onKeyDown={handleKeyDown}
            placeholder={t('aurora.placeholder')}
            rows={1}
            className="flex-1 min-w-0 self-center bg-transparent resize-none outline-none text-cream placeholder:text-[#8E89AE] py-2"
            style={{ fontFamily: 'var(--font-ui)', fontSize: 16, lineHeight: 1.5, maxHeight: 120 }}
          />
          <button
            type="button"
            aria-label="Enviar"
            onClick={() => send(input)}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-opacity"
            style={{ background: 'linear-gradient(180deg, #FBE0A6, #E7B865 55%, #C98F35)', boxShadow: '0 4px 16px rgba(242,180,90,.45)', opacity: input.trim() && !sending ? 1 : 0.5 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="m-0 -mt-0.5 text-center text-[11px] text-[#8E89AE]">{t('aurora.disclaimer')}</p>
      </div>
    </div>
  )
}
