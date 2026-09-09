// components/StationSelector.tsx
// Header with station chips, active station badge, and Reset Chat button

'use client'

import { Monitor, RefreshCw, PanelLeftClose, PanelLeft, Navigation, MapPin, Box, FileText, History } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { STATIONS } from '@/lib/stations'
import { cn } from '@/lib/utils'

export default function StationSelector() {
  const { state, setStation, resetChat, toggleSidebar, toggleNavigator, toggle3DModel, toggleActivitySheet, toggleHistoryModal } = useChat()
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!

  return (
    <header
      id="app-header"
      className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm flex-shrink-0"
    >
      {/* Sidebar toggle */}
      <button
        id="toggle-sidebar-btn"
        onClick={toggleSidebar}
        className="text-slate-400 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 focus-ring"
        aria-label={state.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {state.sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
      </button>

      {/* Logo + Title */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center station-pulse">
          <Monitor size={16} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">ComCoach</h1>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">
            Computer Troubleshooting Lab
          </p>
        </div>
      </div>

      {/* Station chips */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
        {STATIONS.map((station) => {
          const isActive = station.id === state.activeStationId
          return (
            <button
              key={station.id}
              id={`station-btn-${station.number}`}
              onClick={() => setStation(station.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border focus-ring',
                isActive
                  ? `${station.bgColor} ${station.borderColor} ${station.color} shadow-lg`
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
              )}
              aria-pressed={isActive}
            >
              <span>{station.icon}</span>
              <span className="hidden sm:inline">Station {station.number}:</span>
              <span>{station.titleTh}</span>
            </button>
          )
        })}
      </div>

      {/* Chat History Button (ประวัติแชท) */}
      <button
        id="open-history-header-btn"
        onClick={() => toggleHistoryModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 hover:border-violet-500/50 shadow-sm transition-all duration-200 flex-shrink-0 focus-ring"
        title="เปิดประวัติการสนทนาและบันทึกข้อความทุกสถานี"
      >
        <History size={13} className="text-violet-400" />
        <span>ประวัติแชท</span>
      </button>

      {/* Activity Sheet Button (ใบกิจกรรม) */}
      <button
        id="open-worksheet-header-btn"
        onClick={() => toggleActivitySheet(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-200 flex-shrink-0 focus-ring"
        title="เปิดใบกิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์"
      >
        <FileText size={13} className="text-emerald-400" />
        <span>ใบกิจกรรม</span>
      </button>

      {/* 3D Hardware Model Inspector Button */}
      <button
        id="open-3d-model-header-btn"
        onClick={() => toggle3DModel(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 hover:border-sky-500/50 shadow-sm transition-all duration-200 flex-shrink-0 focus-ring"
        title="เปิดโมเดล 3D สำรวจจุดที่คอมเสีย"
      >
        <Box size={13} className="animate-bounce-dot" />
        <span>สำรวจคอม 3D</span>
      </button>

      {/* Lab GPS & Navigator button */}
      <button
        id="open-navigator-header-btn"
        onClick={() => toggleNavigator(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-200 flex-shrink-0 focus-ring"
        title="เปิดแผนที่และระบบนำทางห้องปฏิบัติการ"
      >
        <Navigation size={13} className="animate-pulse" />
        <span>แผนที่ & GPS</span>
      </button>

      {/* Active station badge */}
      <div
        id="active-station-badge"
        className={cn(
          'hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0',
          activeStation.bgColor,
          activeStation.borderColor,
          activeStation.color
        )}
      >
        <span>{activeStation.icon}</span>
        <span>Station {activeStation.number} Active</span>
      </div>

      {/* Reset Chat */}
      <button
        id="reset-chat-btn"
        onClick={resetChat}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 border border-white/10 hover:border-red-500/30 transition-all duration-200 flex-shrink-0 focus-ring"
        title="Reset conversation"
      >
        <RefreshCw size={13} />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </header>
  )
}
