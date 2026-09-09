// components/ChatInterface.tsx
// Main chat area: streaming messages, voice input, image upload, quick prompts, suggestions

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Send,
  Paperclip,
  X,
  Zap,
  ImageIcon,
  AlertCircle,
  MapPin,
  Box,
  Mic,
  MicOff,
  RotateCcw,
  Download,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { STATIONS, QUICK_PROMPTS } from '@/lib/stations'
import { sendChatMessage } from '@/lib/gemini'
import { generateId, fileToBase64 } from '@/lib/utils'
import { cn } from '@/lib/utils'
import MessageBubble, { TypingIndicator } from './MessageBubble'
import type { ChatMessage } from '@/context/ChatContext'

// ─── Web Speech API types ─────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void
  onerror: () => void
  onend: () => void
  start: () => void
  stop: () => void
}

// ─── ResetConfirmModal ────────────────────────────────────────────────────────
function ResetConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-2">ล้างประวัติการสนทนา?</h3>
        <p className="text-slate-400 text-sm mb-5">บทสนทนาทั้งหมดจะถูกลบ และ Mission Progress จะรีเซ็ต</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors">ล้างเลย</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatInterface() {
  const {
    state,
    addMessage,
    updateMessage,
    setLoading,
    toggleNavigator,
    toggle3DModel,
    resetChat,
    autoCompleteMissionStep,
    showNameModal,
  } = useChat()
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!

  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.isLoading])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Voice Input ──────────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null

    if (!SpeechRec) {
      setError('เบราว์เซอร์นี้ไม่รองรับ Voice Input (ใช้ Chrome หรือ Edge)')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRec()
    recognition.lang = 'th-TH'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput((prev) => prev + (prev ? ' ' : '') + transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  // ── Export Chat ──────────────────────────────────────────────────────────────
  const exportChat = useCallback(() => {
    const station = STATIONS.find((s) => s.id === state.activeStationId)
    const lines = [
      `ComCoach — บทสนทนาห้อง Lab`,
      `Station: ${station?.number} — ${station?.titleTh}`,
      `นักเรียน: ${state.studentName || 'ไม่ระบุ'}`,
      `วันที่: ${new Date().toLocaleString('th-TH')}`,
      `${'─'.repeat(50)}`,
      '',
    ]
    for (const msg of state.messages) {
      const role = msg.role === 'model' ? '🤖 ComCoach' : `🧑‍🎓 ${state.studentName || 'นักเรียน'}`
      const text = msg.parts.filter((p) => p.text).map((p) => p.text).join('')
      const time = new Date(msg.timestamp).toLocaleTimeString('th-TH')
      lines.push(`[${time}] ${role}`)
      lines.push(text)
      lines.push('')
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ComCoach_Station${station?.number}_${state.studentName || 'Student'}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [state.messages, state.activeStationId, state.studentName])

  // ── Send message with streaming ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed && !imageFile) return
      if (state.isLoading) return

      setError(null)
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      try {
        // Build user message parts
        const userParts: ChatMessage['parts'] = []
        if (trimmed) userParts.push({ text: trimmed })

        let imageBase64: string | undefined
        let mimeType: string | undefined

        if (imageFile) {
          imageBase64 = await fileToBase64(imageFile)
          mimeType = imageFile.type
          userParts.push({ inlineData: { mimeType, data: imageBase64 } })
          clearImage()
        }

        const userMsg: ChatMessage = {
          id: generateId(),
          role: 'user',
          parts: userParts,
          timestamp: Date.now(),
        }

        addMessage(userMsg)

        // Auto-detect mission step from user message
        autoCompleteMissionStep(trimmed)

        setLoading(true)

        // Create a placeholder AI message for streaming
        const aiMsgId = generateId()
        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: 'model',
          parts: [{ text: '' }],
          timestamp: Date.now(),
          streaming: true,
        }
        addMessage(aiMsg)
        setStreamingId(aiMsgId)

        // Call API with streaming
        const allMessages = [...state.messages, userMsg]
        let fullText = ''

        await sendChatMessage({
          stationId: state.activeStationId,
          messages: allMessages,
          imageBase64,
          mimeType,
          studentName: state.studentName || undefined,
          onChunk: (chunk) => {
            fullText += chunk
            updateMessage(aiMsgId, fullText, true)
          },
        })

        // Finalize streaming message
        updateMessage(aiMsgId, fullText, false)
        setStreamingId(null)

        // Auto-detect mission step from AI response
        autoCompleteMissionStep(fullText)

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'
        setError(msg)
        setStreamingId(null)
      } finally {
        setLoading(false)
      }
    },
    [state.messages, state.activeStationId, state.isLoading, state.studentName, imageFile, addMessage, updateMessage, setLoading, autoCompleteMissionStep]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = state.messages.length === 0

  return (
    <>
      {showResetConfirm && (
        <ResetConfirmModal
          onConfirm={() => { resetChat(); setShowResetConfirm(false) }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Chat header bar ── */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {activeStation.icon} {activeStation.titleTh}
            </span>
            {state.studentName && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                👤 {state.studentName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Edit name */}
            {state.studentName && (
              <button
                id="change-name-btn"
                onClick={() => showNameModal(true)}
                className="px-2 py-1 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                title="เปลี่ยนชื่อ"
              >
                ✏️
              </button>
            )}
            {/* Export */}
            {state.messages.length > 0 && (
              <button
                id="export-chat-btn"
                onClick={exportChat}
                title="ส่งออกบทสนทนา"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                <Download size={11} />
                <span>Export</span>
              </button>
            )}
            {/* Reset */}
            {state.messages.length > 0 && (
              <button
                id="reset-chat-btn"
                onClick={() => setShowResetConfirm(true)}
                title="รีเซ็ตบทสนทนา"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
              >
                <RotateCcw size={11} />
                <span>รีเซ็ต</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          id="messages-container"
          className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
        >
          {isEmpty && (
            <div
              id="welcome-card"
              className="flex flex-col items-center justify-center h-full text-center gap-4 py-12 animate-fade-in"
            >
              <div
                className={cn(
                  'w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border shadow-lg',
                  activeStation.bgColor,
                  activeStation.borderColor
                )}
              >
                {activeStation.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {state.studentName ? `สวัสดี ${state.studentName}! ` : ''}Station {activeStation.number}: {activeStation.titleTh}
                </h2>
                <p className="text-sm text-slate-500 max-w-md">{activeStation.titleEn}</p>
              </div>
              <div
                className={cn(
                  'max-w-sm p-4 rounded-xl border text-sm text-slate-300 leading-relaxed',
                  activeStation.bgColor,
                  activeStation.borderColor
                )}
              >
                <p className="font-semibold text-white mb-1">🎯 วัตถุประสงค์</p>
                <p>{activeStation.objective}</p>
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    📍 {activeStation.zone}
                  </span>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      id="welcome-3d-model-btn"
                      onClick={() => toggle3DModel(true)}
                      className="flex-1 sm:flex-none px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <Box size={12} />
                      <span>สำรวจเคส 3D</span>
                    </button>
                    <button
                      id="welcome-navigate-btn"
                      onClick={() => toggleNavigator(true)}
                      className="flex-1 sm:flex-none px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <MapPin size={12} />
                      <span>นำทางไปโต๊ะนี้</span>
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                พิมพ์คำถามหรือเลือก Quick Prompt ด้านล่างเพื่อเริ่มต้น
              </p>
            </div>
          )}

          {state.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Show typing indicator only if loading but no streaming message yet */}
          {state.isLoading && !streamingId && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-4 mb-2 px-4 py-2.5 rounded-lg bg-red-900/30 border border-red-500/30 flex items-center gap-2 animate-fade-in">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500/60 hover:text-red-400 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Quick Prompts ── */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              id={`quick-prompt-${i}`}
              onClick={() => sendMessage(prompt)}
              disabled={state.isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white/[0.05] hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-ring flex-shrink-0"
            >
              <Zap size={11} />
              {prompt}
            </button>
          ))}
        </div>

        {/* ── Input Bar ── */}
        <div className="px-4 pb-4">
          <div className="glass rounded-2xl p-2">
            {/* Image preview */}
            {imagePreview && (
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-14 w-14 object-cover rounded-lg border border-white/20"
                  />
                  <button
                    id="remove-image-btn"
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  <p className="text-slate-400 font-medium flex items-center gap-1">
                    <ImageIcon size={11} /> {imageFile?.name}
                  </p>
                  <p>{imageFile ? (imageFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* File input */}
              <input
                ref={fileInputRef}
                id="image-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* Attach image */}
              <button
                id="attach-image-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={state.isLoading}
                className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20 transition-all duration-200 disabled:opacity-40 focus-ring flex-shrink-0"
                title="แนบรูปภาพ"
              >
                <Paperclip size={18} />
              </button>

              {/* Voice input */}
              <button
                id="voice-input-btn"
                onClick={toggleVoice}
                disabled={state.isLoading}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200 disabled:opacity-40 focus-ring flex-shrink-0',
                  isListening
                    ? 'text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse'
                    : 'text-slate-500 hover:text-violet-400 hover:bg-violet-900/20'
                )}
                title={isListening ? 'หยุดฟัง' : 'พูด (Voice Input)'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                id="chat-input"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎙️ กำลังฟัง...' : 'พิมพ์ข้อความ... (Shift+Enter เพื่อขึ้นบรรทัดใหม่)'}
                rows={1}
                disabled={state.isLoading}
                className="flex-1 bg-transparent resize-none text-sm text-slate-200 placeholder-slate-600 outline-none py-2 px-1 max-h-40 disabled:opacity-50 leading-relaxed"
              />

              {/* Send button */}
              <button
                id="send-message-btn"
                onClick={() => sendMessage(input)}
                disabled={state.isLoading || (!input.trim() && !imageFile)}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200 flex-shrink-0 focus-ring',
                  input.trim() || imageFile
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                )}
                title="ส่งข้อความ"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-1.5">
            ComCoach ใช้ AI — ข้อมูลทุกอย่างเป็นเพียงคำแนะนำ ให้ครูตรวจสอบผลสุดท้าย
          </p>
        </div>
      </div>
    </>
  )
}
