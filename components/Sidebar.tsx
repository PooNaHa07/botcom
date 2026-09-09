// components/Sidebar.tsx
// Collapsible left panel: mission checklist, station switcher, session info, safety rules

'use client'

import {
  CheckCircle2,
  Circle,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Navigation,
  Box,
  Clock,
  MessageSquare,
  Star,
  FileText,
  History,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useChat } from '@/context/ChatContext'
import { STATIONS, SAFETY_RULES } from '@/lib/stations'
import { cn } from '@/lib/utils'

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function Sidebar() {
  const { state, setStation, toggleMissionStep, toggleNavigator, toggle3DModel, toggleActivitySheet, toggleHistoryModal } = useChat()
  const [safetyExpanded, setSafetyExpanded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!

  const completedCount = state.missionSteps.filter((s) => s.completed).length
  const progressPct = (completedCount / state.missionSteps.length) * 100

  // Live session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - state.sessionStartTime)
    }, 1000)
    return () => clearInterval(timer)
  }, [state.sessionStartTime])

  // Count ratings
  const ratings = Object.values(state.messageRatings)
  const positiveRatings = ratings.filter((r) => r === 1).length
  const totalRated = ratings.length

  if (!state.sidebarOpen) return null

  return (
    <aside
      id="sidebar"
      className="w-72 flex-shrink-0 flex flex-col gap-4 p-4 border-r border-white/10 bg-slate-900/40 overflow-y-auto sidebar-transition"
    >
      {/* ── Student Name Card ── */}
      {state.studentName && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧑‍🎓</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{state.studentName}</p>
              <p className="text-[10px] text-slate-500">กำลังทำ Station {activeStation.number}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Session Stats ── */}
      <section id="session-stats-section" className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <div className="flex items-center justify-center mb-0.5 text-violet-400">
            <Clock size={12} />
          </div>
          <p className="text-[10px] font-bold text-white">{formatDuration(elapsed)}</p>
          <p className="text-[9px] text-slate-500">เวลา</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <div className="flex items-center justify-center mb-0.5 text-sky-400">
            <MessageSquare size={12} />
          </div>
          <p className="text-[10px] font-bold text-white">{state.messages.length}</p>
          <p className="text-[9px] text-slate-500">ข้อความ</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <div className="flex items-center justify-center mb-0.5 text-yellow-400">
            <Star size={12} />
          </div>
          <p className="text-[10px] font-bold text-white">
            {totalRated > 0 ? `${positiveRatings}/${totalRated}` : '—'}
          </p>
          <p className="text-[9px] text-slate-500">Rating</p>
        </div>
      </section>

      {/* ── Tools Section: Activity Sheet, 3D Hardware Inspector & GPS ── */}
      <section id="sidebar-tools-section" className="space-y-2">
        {/* Activity Sheet Card */}
        <button
          id="open-worksheet-sidebar-btn"
          onClick={() => toggleActivitySheet(true)}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 hover:border-emerald-400/70 transition-all text-left group shadow-sm focus-ring"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <FileText size={11} className="text-emerald-400" />
              Activity Worksheet
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              6 ภารกิจ
            </span>
          </div>
          <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
            📋 บันทึกใบกิจกรรมประจำฐาน
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            บันทึกผลตาม PDF ดึงข้อมูล AI & สั่งพิมพ์ A4
          </p>
        </button>

        {/* Chat History Card */}
        <button
          id="open-history-sidebar-btn"
          onClick={() => toggleHistoryModal(true)}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-violet-950/70 to-slate-900 border border-violet-500/30 hover:border-violet-400/60 transition-all text-left group shadow-sm focus-ring"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <History size={11} className="text-violet-400" />
              Chat History & Archive
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
              บันทึกทุกฐาน
            </span>
          </div>
          <p className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors">
            💬 ดูประวัติการสนทนา & ส่งออก
          </p>
        </button>

        {/* 3D Hardware Inspector Card */}
        <button
          id="open-3d-model-sidebar-btn"
          onClick={() => toggle3DModel(true)}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-950/70 to-slate-900 border border-sky-500/30 hover:border-sky-400/60 transition-all text-left group shadow-sm focus-ring"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <Box size={12} className="animate-spin-slow" />
              3D Hardware Navigator
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
              3D PC Case
            </span>
          </div>
          <p className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
            🎮 สำรวจจุดที่คอมเสียแบบ 3D
          </p>
        </button>

        {/* Indoor GPS Navigator Card */}
        <button
          id="open-navigator-sidebar-btn"
          onClick={() => toggleNavigator(true)}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-900 border border-white/10 hover:border-emerald-500/40 transition-all text-left group shadow-sm focus-ring"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Navigation size={11} className="animate-pulse" />
              Indoor GPS Navigator
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
              Room 402
            </span>
          </div>
          <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
            🗺️ เปิดผังห้องแล็บ & นำทาง
          </p>
        </button>
      </section>

      <div className="border-t border-white/10" />

      {/* ── Mission Progress ── */}
      <section id="mission-progress-section">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ภารกิจ 6 ขั้นตอน
          </h2>
          <span className="text-xs text-emerald-400 font-medium">
            {completedCount}/{state.missionSteps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full mb-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && (
          <p className="text-[10px] text-emerald-400 text-center mb-2 animate-fade-in">
            🎉 ทำภารกิจครบทั้ง 6 ขั้นแล้ว! อย่าลืมกดเปิดใบกิจกรรม
          </p>
        )}

        {/* Steps */}
        <div className="space-y-1.5 mt-2">
          {state.missionSteps.map((step) => (
            <button
              key={step.id}
              id={`mission-step-${step.id}`}
              onClick={() => toggleMissionStep(step.id)}
              className={cn(
                'w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 group border focus-ring',
                step.completed
                  ? 'bg-emerald-900/30 border-emerald-500/30'
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
              )}
              aria-pressed={step.completed}
            >
              {step.completed ? (
                <CheckCircle2
                  size={15}
                  className="text-emerald-400 flex-shrink-0 mt-0.5"
                />
              ) : (
                <Circle
                  size={15}
                  className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-0.5 transition-colors"
                />
              )}
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-xs font-medium leading-tight',
                    step.completed ? 'text-emerald-300 line-through' : 'text-slate-300'
                  )}
                >
                  {step.id}. {step.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{step.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="border-t border-white/10" />

      {/* ── Station Switcher ── */}
      <section id="station-switcher-section">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          4 ฐานการสำรวจ
        </h2>
        <div className="space-y-1.5">
          {STATIONS.map((station) => {
            const isActive = station.id === state.activeStationId
            return (
              <button
                key={station.id}
                id={`sidebar-station-${station.number}`}
                onClick={() => setStation(station.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 border focus-ring',
                  isActive
                    ? `${station.bgColor} ${station.borderColor}`
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                )}
                aria-pressed={isActive}
              >
                <span className="text-lg leading-none">{station.icon}</span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-xs font-semibold truncate',
                      isActive ? station.color : 'text-slate-300'
                    )}
                  >
                    ฐานที่ {station.number}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{station.titleTh}</p>
                </div>
                {isActive && (
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', station.color.replace('text-', 'bg-'))} />
                )}
              </button>
            )
          })}
        </div>

        {/* Active station objective & PDF metadata card */}
        <div
          id="station-objective-card"
          className={cn(
            'mt-3 p-3 rounded-xl border space-y-2',
            activeStation.bgColor,
            activeStation.borderColor
          )}
        >
          <div>
            <p className={cn('text-[10px] font-semibold uppercase tracking-wider', activeStation.color)}>
              สถานการณ์ประจำฐาน
            </p>
            <p className="text-xs text-white mt-0.5 leading-relaxed font-medium">
              "{activeStation.situation}"
            </p>
          </div>

          <div className="text-[11px] pt-1.5 border-t border-white/10 space-y-1">
            <p className="text-slate-300">
              <span className="text-slate-500">สมรรถนะ: </span>
              <span className="text-emerald-400 font-medium">{activeStation.targetCompetency}</span>
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">แนวลำดับครู: </span>
              <span className="text-sky-300 font-mono text-[10px]">{activeStation.teacherSequence.join(' ➔ ')}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-white/10" />

      {/* ── Safety Rules (3.2 จาก PDF) ── */}
      <section id="safety-rules-section">
        <button
          id="toggle-safety-rules"
          onClick={() => setSafetyExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2 hover:text-amber-400 transition-colors focus-ring rounded"
        >
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={13} />
            กติกาความปลอดภัย (3.2)
          </span>
          {safetyExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {safetyExpanded && (
          <div className="space-y-2 animate-fade-in">
            {SAFETY_RULES.map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed"
              >
                <span className="text-amber-500 flex-shrink-0 mt-0.5 font-bold">•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  )
}
