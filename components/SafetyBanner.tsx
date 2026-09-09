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
      className="safety-shimmer flex items-center justify-between gap-3 px-4 py-2 border-b border-amber-500/30"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle
          size={15}
          className="text-amber-400 flex-shrink-0 animate-pulse-slow"
        />
        <p className="text-xs text-amber-200 truncate">
          <span className="font-semibold text-amber-400">⚠️ กติกาความปลอดภัย (3.2):</span>{' '}
          ก่อนถอดเสียบอุปกรณ์ต้องปิดเครื่องถอดปลั๊ก | ห้ามจับขั้วทองแดง RAM/GPU | ทุกฐานต้องบันทึกข้อสรุปลงใบกิจกรรม
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => toggleActivitySheet(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
        >
          <FileText size={11} />
          <span>เปิดใบกิจกรรม</span>
        </button>
        <button
          id="dismiss-safety-banner"
          onClick={() => setDismissed(true)}
          className="text-amber-500/60 hover:text-amber-400 transition-colors p-0.5 focus-ring rounded"
          aria-label="Dismiss safety banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
