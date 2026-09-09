// components/SafetyBanner.tsx
// Persistent amber safety warning banner shown at all times

'use client'

import { AlertTriangle, X, FileText } from 'lucide-react'
import { useState } from 'react'
import { useChat } from '@/context/ChatContext'

export default function SafetyBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { toggleActivitySheet } = useChat()

  if (dismissed) return null

  return (
    <div
      id="safety-banner"
      role="alert"
      className="safety-shimmer flex items-center justify-between gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 border-b border-amber-500/30 flex-shrink-0 z-30"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
        <AlertTriangle
          size={13}
          className="text-amber-400 flex-shrink-0 animate-pulse-slow"
        />
        <p className="text-[11px] sm:text-xs text-amber-200 truncate leading-tight">
          <span className="font-bold text-amber-400">กติกาความปลอดภัย:</span>{' '}
          <span className="hidden sm:inline">ก่อนถอดเสียบอุปกรณ์ต้องปิดเครื่องถอดปลั๊ก | ห้ามจับขั้วทองแดง RAM/GPU | ทุกฐานต้องบันทึกข้อสรุปลงใบกิจกรรม</span>
          <span className="inline sm:hidden">ปิดเครื่องถอดปลั๊กก่อนจับอุปกรณ์ • บันทึกผลลงใบกิจกรรม</span>
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => toggleActivitySheet(true)}
          className="hidden sm:flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-300 hover:text-white px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
        >
          <FileText size={11} />
          <span>ใบกิจกรรม</span>
        </button>
        <button
          id="dismiss-safety-banner"
          onClick={() => setDismissed(true)}
          className="text-amber-400/70 hover:text-amber-300 transition-colors p-1 focus-ring rounded-lg"
          aria-label="Dismiss safety banner"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

