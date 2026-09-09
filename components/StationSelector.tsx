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
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-md flex-shrink-0 z-30"
    >
      {/* Sidebar toggle */}
      <button
        id="toggle-sidebar-btn"
        onClick={toggleSidebar}
        className="text-slate-400 hover:text-emerald-400 transition-colors p-2 rounded-xl hover:bg-white/5 focus-ring flex-shrink-0"
        aria-label={state.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title="เมนู & ภารกิจ"
      >
        {state.sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeft size={19} />}
      </button>

      {/* Logo + Title */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center station-pulse">
          <Monitor size={15} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white leading-none">ComCoach</h1>
          <p className="hidden sm:block text-[10px] text-slate-500 leading-none mt-0.5">
            Troubleshooting Lab
          </p>
        </div>
      </div>

      {/* Station chips */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x py-0.5">
        {STATIONS.map((station) => {
          const isActive = station.id === state.activeStationId
          return (
            <button
              key={station.id}
              id={`station-btn-${station.number}`}
              onClick={() => setStation(station.id)}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border focus-ring flex-shrink-0',
                isActive
                  ? `${station.bgColor} ${station.borderColor} ${station.color} shadow-lg ring-1 ring-emerald-500/30`
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
              )}
              aria-pressed={isActive}
            >
              <span>{station.icon}</span>
              <span className="hidden sm:inline">Station {station.number}:</span>
              <span className="sm:hidden font-semibold">ฐาน {station.number}</span>
              <span className="hidden xs:inline">{station.titleTh}</span>
            </button>
          )
        })}
      </div>

      {/* Action buttons on right */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Chat History Button (ประวัติแชท) */}
        <button
          id="open-history-header-btn"
          onClick={() => toggleHistoryModal(true)}
          className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 hover:border-violet-500/50 shadow-sm transition-all duration-200 focus-ring"
          title="ประวัติการสนทนา"
          aria-label="ประวัติการสนทนา"
        >
          <History size={15} className="text-violet-400" />
          <span className="hidden md:inline">ประวัติแชท</span>
        </button>

        {/* Activity Sheet Button (ใบกิจกรรม) */}
        <button
          id="open-worksheet-header-btn"
          onClick={() => toggleActivitySheet(true)}
          className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-200 focus-ring"
          title="ใบกิจกรรมสำรวจอาการเสีย"
          aria-label="ใบกิจกรรม"
        >
          <FileText size={15} className="text-emerald-400" />
          <span className="hidden md:inline">ใบกิจกรรม</span>
        </button>

        {/* 3D Hardware Model Inspector Button */}
        <button
          id="open-3d-model-header-btn"
          onClick={() => toggle3DModel(true)}
          className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 hover:border-sky-500/50 shadow-sm transition-all duration-200 focus-ring"
          title="สำรวจคอมพิวเตอร์ 3D"
          aria-label="สำรวจคอม 3D"
        >
          <Box size={15} className="animate-bounce-dot text-sky-400" />
          <span className="hidden lg:inline">สำรวจคอม 3D</span>
        </button>

        {/* Lab GPS & Navigator button */}
        <button
          id="open-navigator-header-btn"
          onClick={() => toggleNavigator(true)}
          className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-200 focus-ring"
          title="แผนที่ & GPS ห้องแล็บ"
          aria-label="แผนที่ & GPS"
        >
          <Navigation size={15} className="animate-pulse" />
          <span className="hidden lg:inline">แผนที่ & GPS</span>
        </button>

        {/* Reset Chat */}
        <button
          id="reset-chat-btn"
          onClick={resetChat}
          className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 border border-white/10 hover:border-red-500/30 transition-all duration-200 focus-ring"
          title="Reset conversation"
          aria-label="Reset chat"
        >
          <RefreshCw size={14} />
          <span className="hidden xl:inline">Reset</span>
        </button>
      </div>
    </header>
  )
}
