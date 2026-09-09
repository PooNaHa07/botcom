// components/StudentNameModal.tsx
// Modal to collect student name on first visit
// The name is used by ComCoach AI to personalize responses

'use client'

import { useState, useEffect, useRef } from 'react'
import { UserCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useChat } from '@/context/ChatContext'

export default function StudentNameModal() {
  const { state, setStudentName, showNameModal } = useChat()
  const [name, setName] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.showNameModal) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [state.showNameModal])

  if (!state.showNameModal) return null

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
      return
    }
    setStudentName(trimmed)
  }

  const handleSkip = () => {
    setStudentName('นักเรียน')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') handleSkip()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
              <UserCircle size={36} className="text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">
            สวัสดี! 👋
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            ฉันคือ <span className="text-emerald-400 font-semibold">ComCoach</span> — ผู้ช่วย AI ของคุณในห้อง Lab นี้
          </p>
          <p className="text-slate-500 text-[11px] sm:text-xs mt-1">
            บอกชื่อเพื่อให้ฉันช่วยได้ดียิ่งขึ้น
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            ชื่อของคุณ
          </label>
          <input
            ref={inputRef}
            id="student-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="เช่น มินา, ปีเตอร์, ..."
            maxLength={30}
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none text-base sm:text-sm transition-all duration-200
              focus:border-emerald-500/60 focus:bg-emerald-500/5 focus:shadow-lg focus:shadow-emerald-500/10
              ${shake ? 'animate-shake border-red-500/60' : 'border-white/10'}`}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            id="skip-name-btn"
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            ข้าม
          </button>
          <button
            id="submit-name-btn"
            onClick={handleSubmit}
            className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            เริ่มเลย!
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Station hint */}
        <p className="text-center text-[11px] text-slate-600 mt-4">
          ข้อมูลนี้ใช้เพื่อการเรียนรู้เท่านั้น — ไม่มีการบันทึกลงเซิร์ฟเวอร์
        </p>
      </div>
    </div>
  )
}
