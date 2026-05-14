import { useEffect, useRef, useState } from 'react'
import { TopBar, Spinner, Hairline } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { track, Events } from '@/lib/analytics'
import type { Profile, ChatMessage } from '@/types'

interface Props {
  profile: Profile
}

const SUGGESTIONS = [
  'What does my life line say about the next few years?',
  'Am I making the right decision?',
  'What patterns keep repeating in my life?',
  'Tell me more about my heart line.',
  'What should I focus on right now?',
]

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full mr-3 mt-0.5 flex items-center justify-center"
          style={{ background: 'rgba(201,169,97,0.12)', border: '1px solid rgba(201,169,97,0.25)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={{
          background: isUser ? 'rgba(201,169,97,0.12)' : 'var(--bg-surface)',
          border: isUser ? '1px solid rgba(201,169,97,0.2)' : '1px solid var(--border-subtle)',
        }}
      >
        <p
          style={{
            fontFamily: isUser ? 'var(--font-sans)' : 'var(--font-serif)',
            fontSize: isUser ? 14 : 15,
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            letterSpacing: isUser ? 0 : '0.003em',
          }}
        >
          {msg.content}
        </p>
        <p className="text-[10px] text-text-muted mt-1 text-right">
          {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(201,169,97,0.12)', border: '1px solid rgba(201,169,97,0.25)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01z" />
        </svg>
      </div>
      <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-gold"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

export function AuroraChat({ profile }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
        // silent fail — show empty state
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
        body: JSON.stringify({ user_id: profile.id, message: text.trim() }),
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
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const isEmpty = messages.length === 0 && !loading

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(201,169,97,0.12)', border: '1px solid rgba(201,169,97,0.3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01z" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Aurora
          </h1>
          <p className="text-[11px] text-text-muted tracking-wider uppercase">She knows your palm</p>
        </div>
      </div>

      <Hairline className="mx-5" />

      {/* Messages */}
      <div className="flex-1 scroll-area px-5 py-5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={24} className="text-accent-gold" />
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <div className="flex flex-col justify-end h-full pb-4 gap-6">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 12px' }}>
                <circle cx="24" cy="24" r="20" stroke="#C9A961" strokeWidth="0.6" opacity="0.2"/>
                <path d="M10 34c8-14 20-14 28 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M13 34c6-10 16-10 22 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M17 34c3-6 11-6 14 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="24" cy="28" r="2.5" fill="#C9A961" opacity="0.6"/>
              </svg>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Ask Aurora anything.<br/>
                <em style={{ color: 'var(--text-secondary)', fontSize: 15 }}>She's read your palm.</em>
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-xl text-sm text-text-secondary transition-colors"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {sending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-28 pt-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
        <div className="flex items-end gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aurora…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-text-primary placeholder:text-text-muted"
            style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.5, maxHeight: 120 }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
            style={{
              background: input.trim() && !sending ? 'var(--accent-gold)' : 'var(--border-subtle)',
              opacity: input.trim() && !sending ? 1 : 0.5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !sending ? 'var(--bg-primary)' : 'var(--text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-text-muted mt-2">Aurora may not always be accurate.</p>
      </div>
    </div>
  )
}
