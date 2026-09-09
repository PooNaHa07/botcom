// components/MessageBubble.tsx
// Renders individual chat messages with rich markdown, copy button, and feedback

'use client'

import { useState, useCallback } from 'react'
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, ImageIcon } from 'lucide-react'
import { ChatMessage } from '@/context/ChatContext'
import { useChat } from '@/context/ChatContext'
import { cn } from '@/lib/utils'

interface Props {
  message: ChatMessage
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return 'เมื่อกี้'
  if (diff < 60) return `${diff} วินาทีที่แล้ว`
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  let i = 0
  let keyCounter = 0
  const k = () => keyCounter++

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (line.trim() === '') {
      result.push(<div key={k()} className="h-2" />)
      i++
      continue
    }

    // H1
    if (line.startsWith('# ')) {
      result.push(<h1 key={k()} className="text-base font-bold text-white mt-2 mb-1">{inlineRender(line.slice(2))}</h1>)
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      result.push(<h2 key={k()} className="text-sm font-bold text-emerald-300 mt-2 mb-1">{inlineRender(line.slice(3))}</h2>)
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      result.push(<h3 key={k()} className="text-sm font-semibold text-slate-200 mt-1.5 mb-1">{inlineRender(line.slice(4))}</h3>)
      i++
      continue
    }

    // Numbered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, '')
        items.push(<li key={k()} className="ml-1">{inlineRender(text)}</li>)
        i++
      }
      result.push(
        <ol key={k()} className="list-decimal list-inside space-y-0.5 text-sm my-1 pl-1">
          {items}
        </ol>
      )
      continue
    }

    // Bullet list — collect consecutive items
    if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('• ') || lines[i].startsWith('* '))) {
        const text = lines[i].slice(2)
        items.push(<li key={k()} className="ml-1 flex gap-1.5"><span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span><span>{inlineRender(text)}</span></li>)
        i++
      }
      result.push(
        <ul key={k()} className="space-y-0.5 text-sm my-1 pl-1">
          {items}
        </ul>
      )
      continue
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      result.push(
        <pre key={k()} className="bg-slate-950/70 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto">
          {lang && <div className="text-[10px] text-slate-500 mb-1 font-mono">{lang}</div>}
          <code className="text-xs text-emerald-300 font-mono leading-relaxed">{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Horizontal rule
    if (line === '---' || line === '━━━' || line.startsWith('━━━')) {
      result.push(<hr key={k()} className="border-white/10 my-2" />)
      i++
      continue
    }

    // Normal paragraph
    result.push(
      <p key={k()} className="text-sm leading-relaxed">
        {inlineRender(line)}
      </p>
    )
    i++
  }

  return result
}

// ─── Inline renderer (bold, italic, code, emoji) ─────────────────────────────

function inlineRender(text: string): React.ReactNode {
  // Split by bold (**text**), italic (*text*), inline code (`text`)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-900/80 text-emerald-300 px-1 py-0.5 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

export default function MessageBubble({ message }: Props) {
  const { state, setMessageRating } = useChat()
  const isCoach = message.role === 'model'
  const textParts = message.parts.filter((p) => p.text)
  const imageParts = message.parts.filter((p) => p.inlineData)
  const [copied, setCopied] = useState(false)
  const [timeHovered, setTimeHovered] = useState(false)
  const currentRating = state.messageRatings[message.id]

  const fullText = textParts.map((p) => p.text).join('\n')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [fullText])

  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3 message-enter group',
        isCoach ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 border mt-0.5 sm:mt-1 shadow-sm',
          isCoach
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            : 'bg-slate-700/60 border-slate-600/40 text-slate-300'
        )}
      >
        {isCoach ? <Bot size={13} className="sm:w-4 sm:h-4" /> : <User size={13} className="sm:w-4 sm:h-4" />}
      </div>

      {/* Content */}
      <div
        className={cn(
          'min-w-0 flex-1 max-w-[88%] sm:max-w-[85%] md:max-w-[78%] flex flex-col gap-1.5',
          isCoach ? 'items-start' : 'items-end'
        )}
      >
        {/* Label + timestamp */}
        <span
          className="text-[10px] text-slate-500 px-1 cursor-default select-none truncate max-w-full"
          onMouseEnter={() => setTimeHovered(true)}
          onMouseLeave={() => setTimeHovered(false)}
          title={new Date(message.timestamp).toLocaleString('th-TH')}
        >
          {isCoach
            ? `🤖 ComCoach${state.studentName ? ` → ${state.studentName}` : ''}`
            : `🧑‍🎓 ${state.studentName || 'คุณ'}`}{' '}
          · {timeHovered
            ? new Date(message.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : relativeTime(message.timestamp)}
        </span>

        {/* Image attachments */}
        {imageParts.map((part, i) =>
          part.inlineData ? (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-white/10 max-w-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                alt="Uploaded image"
                className="w-full object-cover max-h-48"
              />
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/50">
                <ImageIcon size={10} className="text-slate-500" />
                <span className="text-[10px] text-slate-500">รูปภาพที่แนบมา</span>
              </div>
            </div>
          ) : null
        )}

        {/* Text content */}
        {textParts.map(
          (part, i) =>
            part.text && (
              <div
                key={i}
                className={cn(
                  'px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed relative min-w-0 max-w-full break-words break-anywhere',
                  isCoach
                    ? 'glass-emerald text-slate-100 rounded-tl-sm'
                    : 'glass-slate text-slate-200 rounded-tr-sm'
                )}
              >
                {/* Streaming cursor */}
                {message.streaming && (
                  <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-blink align-middle" />
                )}
                <div
                  className={cn(
                    'space-y-1 min-w-0 max-w-full break-words break-anywhere',
                    isCoach ? '[&_strong]:text-emerald-300 [&_code]:text-emerald-300' : '[&_strong]:text-slate-200'
                  )}
                >
                  {isCoach ? renderMarkdown(part.text) : <p className="text-sm leading-relaxed whitespace-pre-wrap break-words break-anywhere">{part.text}</p>}
                </div>
              </div>
            )
        )}

        {/* Action buttons — visible on hover */}
        {isCoach && !message.streaming && fullText && (
          <div className="flex items-center gap-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Copy */}
            <button
              id={`copy-msg-${message.id}`}
              onClick={handleCopy}
              title="คัดลอกข้อความ"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            >
              {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </button>

            {/* Thumbs Up */}
            <button
              id={`rate-up-${message.id}`}
              onClick={() => setMessageRating(message.id, 1)}
              title="ตอบได้ดี"
              className={cn(
                'p-1.5 rounded-lg text-[10px] border transition-all',
                currentRating === 1
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-slate-600 hover:text-emerald-400 border-transparent hover:border-white/10 hover:bg-white/5'
              )}
            >
              <ThumbsUp size={10} />
            </button>

            {/* Thumbs Down */}
            <button
              id={`rate-down-${message.id}`}
              onClick={() => setMessageRating(message.id, -1)}
              title="ตอบได้ไม่ดี"
              className={cn(
                'p-1.5 rounded-lg text-[10px] border transition-all',
                currentRating === -1
                  ? 'text-red-400 bg-red-500/10 border-red-500/30'
                  : 'text-slate-600 hover:text-red-400 border-transparent hover:border-white/10 hover:bg-white/5'
              )}
            >
              <ThumbsDown size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="flex gap-3 message-enter">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border bg-emerald-500/20 border-emerald-500/40 text-emerald-400">
        <Bot size={16} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-500 px-1">🤖 ComCoach · กำลังคิด...</span>
        <div className="glass-emerald px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  )
}
