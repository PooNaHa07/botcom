// components/ChatHistoryModal.tsx
// Comprehensive Chat History Modal for ComCoach
// Features: per-station history browsing, message search, export (.txt / .json), and clear history controls

'use client'

import { useState, useMemo } from 'react'
import {
  History,
  X,
  Search,
  Download,
  Trash2,
  Calendar,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { useChat, ChatMessage } from '@/context/ChatContext'
import { STATIONS } from '@/lib/stations'
import { cn } from '@/lib/utils'

export default function ChatHistoryModal() {
  const {
    state,
    toggleHistoryModal,
    setStation,
    clearStationHistory,
    clearAllHistory,
  } = useChat()

  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmClearStation, setConfirmClearStation] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  if (!state.historyModalOpen) return null

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  // Get messages for display
  const stationMessages = useMemo(() => {
    const map: Record<string, ChatMessage[]> = {}
    for (const station of STATIONS) {
      // If currently active station, prioritize live state.messages, otherwise messagesByStation
      if (station.id === state.activeStationId) {
        map[station.id] = state.messages
      } else {
        map[station.id] = state.messagesByStation[station.id] || []
      }
    }
    return map
  }, [state.activeStationId, state.messages, state.messagesByStation])

  const totalAllMessages = Object.values(stationMessages).reduce(
    (acc, list) => acc + list.length,
    0
  )

  // Filter messages based on tab and search
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const stationsToInclude =
      selectedTab === 'all'
        ? STATIONS
        : STATIONS.filter((s) => s.id === selectedTab)

    return stationsToInclude.map((station) => {
      const msgs = stationMessages[station.id] || []
      const matchedMsgs = q
        ? msgs.filter((m) =>
            m.parts.some((p) => p.text?.toLowerCase().includes(q))
          )
        : msgs
      return {
        station,
        messages: matchedMsgs,
        totalCount: msgs.length,
      }
    })
  }, [selectedTab, searchQuery, stationMessages])

  // Export specific station chat as Text
  const exportStation = (stationId: string) => {
    const station = STATIONS.find((s) => s.id === stationId)
    const msgs = stationMessages[stationId] || []
    if (msgs.length === 0) {
      showToast('ไม่มีข้อความในสถานีนี้')
      return
    }

    const lines = [
      `============================================================`,
      `ComCoach — บันทึกประวัติการสนทนาห้องปฏิบัติการคอมพิวเตอร์`,
      `สถานี: ฐานที่ ${station?.number} — ${station?.titleTh}`,
      `สถานการณ์: ${station?.situation}`,
      `ผู้เรียน: ${state.studentName || 'ไม่ระบุชื่อ'}`,
      `ส่งออกเมื่อ: ${new Date().toLocaleString('th-TH')}`,
      `จำนวนข้อความ: ${msgs.length} ข้อความ`,
      `============================================================\n`,
    ]

    for (const m of msgs) {
      const role = m.role === 'model' ? '🤖 ComCoach (AI Coach)' : `🧑‍🎓 ${state.studentName || 'ผู้เรียน'}`
      const time = new Date(m.timestamp).toLocaleTimeString('th-TH')
      const text = m.parts.map((p) => p.text || '').join('\n')
      lines.push(`[${time}] ${role}:`)
      lines.push(text)
      lines.push(`------------------------------------------------------------\n`)
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ComCoach_ChatHistory_Station${station?.number}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`ส่งออกประวัติฐานที่ ${station?.number} สำเร็จ!`)
  }

  // Export all stations history as JSON
  const exportAllJSON = () => {
    const payload = {
      app: 'ComCoach',
      studentName: state.studentName,
      exportedAt: new Date().toISOString(),
      stations: STATIONS.map((s) => ({
        stationId: s.id,
        stationNumber: s.number,
        title: s.titleTh,
        situation: s.situation,
        messageCount: (stationMessages[s.id] || []).length,
        messages: stationMessages[s.id] || [],
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ComCoach_AllStations_History_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('ส่งออกประวัติทั้งหมดทุกสถานี (JSON) สำเร็จ!')
  }

  const handleClearStation = (stationId: string) => {
    clearStationHistory(stationId)
    setConfirmClearStation(null)
    showToast('ล้างประวัติสถานีนี้เรียบร้อย')
  }

  const handleClearAll = () => {
    clearAllHistory()
    setConfirmClearAll(false)
    showToast('ล้างประวัติการสนทนาทั้งหมดเรียบร้อย')
  }

  return (
    <div
      id="chat-history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div
        id="chat-history-container"
        className="relative w-full max-w-4xl h-[96vh] sm:h-auto sm:max-h-[90vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-white/10 bg-slate-950/80 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <History size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="history-modal-title" className="text-xs sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>ประวัติการสนทนา</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  {totalAllMessages} ข้อความ
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-400">
                ประวัติถูกบันทึกอัตโนมัติแยกตามสถานี 1–4 และจัดเก็บในเบราว์เซอร์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              id="export-all-history-btn"
              onClick={exportAllJSON}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors focus-ring"
              title="ส่งออกประวัติทุกสถานีเป็นไฟล์ JSON"
            >
              <Download size={13} />
              <span className="hidden sm:inline">ส่งออกทั้งหมด (JSON)</span>
            </button>
            <button
              id="close-history-modal-btn"
              onClick={() => toggleHistoryModal(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-ring"
              aria-label="Close history"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Filter & Search Bar ── */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-slate-900/60 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between flex-shrink-0">
          {/* Station selector tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x w-full sm:w-auto pb-0.5 sm:pb-0">
            <button
              onClick={() => setSelectedTab('all')}
              className={cn(
                'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border focus-ring flex-shrink-0',
                selectedTab === 'all'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
              )}
            >
              ทั้งหมด ({totalAllMessages})
            </button>
            {STATIONS.map((s) => {
              const count = (stationMessages[s.id] || []).length
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedTab(s.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border focus-ring flex-shrink-0',
                    selectedTab === s.id
                      ? `${s.bgColor} ${s.borderColor} ${s.color} shadow-sm`
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                  )}
                >
                  <span>{s.icon}</span>
                  <span>ฐาน {s.number}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60 flex-shrink-0">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาข้อความ..."
              className="w-full pl-8 pr-7 py-1.5 text-base sm:text-xs bg-slate-950/80 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Toast Notification ── */}
        {toastMsg && (
          <div className="px-6 py-2 bg-emerald-950/90 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ── Content: Station Message History ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {totalAllMessages === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <MessageSquare size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">ยังไม่มีประวัติการสนทนา</p>
              <p className="text-xs text-slate-500 mt-1">
                เมื่อเริ่มคุยกับ AI ComCoach ในแต่ละฐาน ข้อความจะถูกจัดเก็บลงที่นี่โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            filteredData.map(({ station, messages, totalCount }) => {
              if (messages.length === 0 && searchQuery) return null

              return (
                <div
                  key={station.id}
                  className="rounded-xl border border-white/10 bg-slate-950/50 overflow-hidden"
                >
                  {/* Station Group Header */}
                  <div
                    className={cn(
                      'px-4 py-3 flex items-center justify-between border-b',
                      station.bgColor,
                      station.borderColor
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{station.icon}</span>
                      <div>
                        <h3 className={cn('text-xs font-bold flex items-center gap-2', station.color)}>
                          ฐานที่ {station.number}: {station.titleTh}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-normal">
                            {totalCount} ข้อความ
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-400 truncate max-w-md">
                          "{station.situation}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Jump to station */}
                      <button
                        onClick={() => {
                          setStation(station.id)
                          toggleHistoryModal(false)
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors focus-ring"
                        title="เปิดสถานีนี้ในแชท"
                      >
                        <span>ไปที่ฐานนี้</span>
                        <ArrowRight size={11} />
                      </button>

                      {/* Export station */}
                      <button
                        onClick={() => exportStation(station.id)}
                        disabled={totalCount === 0}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                        title="ดาวน์โหลดข้อความฐานนี้ (.txt)"
                      >
                        <Download size={13} />
                      </button>

                      {/* Clear station */}
                      {confirmClearStation === station.id ? (
                        <div className="flex items-center gap-1 bg-red-950 border border-red-500/50 px-2 py-0.5 rounded text-[10px] text-red-300 animate-fade-in">
                          <span>ลบประวัติ?</span>
                          <button
                            onClick={() => handleClearStation(station.id)}
                            className="font-bold text-red-400 hover:text-red-200 underline ml-1"
                          >
                            ยืนยัน
                          </button>
                          <button
                            onClick={() => setConfirmClearStation(null)}
                            className="text-slate-400 hover:text-slate-200 ml-1"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmClearStation(station.id)}
                          disabled={totalCount === 0}
                          className="p-1 rounded bg-white/5 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-40"
                          title="ล้างข้อความของฐานนี้"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message List */}
                  <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-4">
                        {searchQuery ? 'ไม่พบข้อความที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อความในฐานนี้'}
                      </p>
                    ) : (
                      messages.map((msg) => {
                        const isAi = msg.role === 'model'
                        const text = msg.parts.map((p) => p.text || '').join('\n')
                        const time = new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex gap-2.5 text-xs p-2.5 rounded-lg border',
                              isAi
                                ? 'bg-slate-900/90 border-white/5 text-slate-300'
                                : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-100'
                            )}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]',
                                isAi
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-emerald-600 text-white'
                              )}
                            >
                              {isAi ? <Bot size={11} /> : <User size={11} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-[11px] text-slate-400">
                                  {isAi ? 'ComCoach' : state.studentName || 'คุณ'}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock size={9} />
                                  {time}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed break-words text-[11px]">
                                {text.length > 280 ? text.slice(0, 280) + '...' : text}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            {confirmClearAll ? (
              <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/40 px-3 py-1 rounded-lg text-xs text-red-300 animate-fade-in">
                <AlertCircle size={13} className="text-red-400" />
                <span>ต้องการล้างประวัติทั้งหมดทุกฐานจริงหรือไม่?</span>
                <button
                  onClick={handleClearAll}
                  className="font-bold text-red-400 hover:text-red-200 underline ml-2"
                >
                  ยืนยันลบทั้งหมด
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="text-slate-400 hover:text-slate-200 ml-1"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                disabled={totalAllMessages === 0}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                <Trash2 size={13} />
                <span>ล้างประวัติทั้งหมด</span>
              </button>
            )}
          </div>

          <button
            onClick={() => toggleHistoryModal(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-ring"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  )
}
