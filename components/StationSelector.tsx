// components/StationSelector.tsx
// Header with station chips, active station badge, and responsive mobile tools

'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Monitor,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  Navigation,
  Box,
  FileText,
  History,
  MoreVertical,
  X,
  User,
  Sparkles,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { STATIONS } from '@/lib/stations'
import { cn } from '@/lib/utils'

export default function StationSelector() {
  const {
    state,
    setStation,
    resetChat,
    toggleSidebar,
    toggleNavigator,
    toggle3DModel,
    toggleActivitySheet,
    toggleHistoryModal,
    showNameModal,
  } = useChat()
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close tools popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileToolsOpen(false)
      }
    }
    if (mobileToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileToolsOpen])

  return (
    <div id="app-header-container" className="flex flex-col flex-shrink-0 z-30 border-b border-white/10 bg-slate-900/95 backdrop-blur-md">
      {/* ── Main Top Bar ── */}
      <header
        id="app-header"
        className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5"
      >
        {/* Left: Sidebar toggle + ComCoach logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            id="toggle-sidebar-btn"
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-emerald-400 transition-colors p-1.5 sm:p-2 rounded-xl hover:bg-white/5 focus-ring flex-shrink-0"
            aria-label={state.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            title="เมนู & ภารกิจ"
          >
            {state.sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeft size={19} />}
          </button>

          <div className="flex items-center gap-2">
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
        </div>

        {/* Center on Desktop (md:): Station chips */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center overflow-x-auto no-scrollbar scroll-smooth px-2">
          {STATIONS.map((station) => {
            const isActive = station.id === state.activeStationId
            return (
              <button
                key={station.id}
                id={`station-btn-desktop-${station.number}`}
                onClick={() => setStation(station.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border focus-ring flex-shrink-0',
                  isActive
                    ? `${station.bgColor} ${station.borderColor} ${station.color} shadow-lg ring-1 ring-emerald-500/30`
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                )}
                aria-pressed={isActive}
              >
                <span>{station.icon}</span>
                <span>Station {station.number}:</span>
                <span>{station.titleTh}</span>
              </button>
            )
          })}
        </div>

        {/* Right on Mobile (< md): Student badge + Activity Sheet + Tools Dropdown */}
        <div className="flex md:hidden items-center gap-1.5 flex-shrink-0 relative" ref={menuRef}>
          {/* Student name pill */}
          {state.studentName && (
            <button
              onClick={() => showNameModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] max-w-[90px] truncate"
              title="เปลี่ยนชื่อผู้เรียน"
            >
              <User size={11} className="flex-shrink-0" />
              <span className="truncate">{state.studentName}</span>
            </button>
          )}

          {/* Activity Sheet Button (Prominent) */}
          <button
            id="open-worksheet-mobile-btn"
            onClick={() => toggleActivitySheet(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm transition-all duration-200 focus-ring"
            title="ใบกิจกรรมสำรวจอาการเสีย"
            aria-label="ใบกิจกรรม"
          >
            <FileText size={14} />
            <span>ใบกิจกรรม</span>
          </button>

          {/* Tools Menu Toggle */}
          <button
            id="open-mobile-tools-btn"
            onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
            className={cn(
              'p-1.5 rounded-xl text-slate-400 hover:text-white border transition-colors focus-ring',
              mobileToolsOpen
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/5 border-white/10'
            )}
            title="เครื่องมือเพิ่มเติม"
            aria-label="เครื่องมือเพิ่มเติม"
          >
            {mobileToolsOpen ? <X size={17} /> : <MoreVertical size={17} />}
          </button>

          {/* Mobile Tools Popover Dropdown */}
          {mobileToolsOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-slate-900/95 border border-white/15 p-2 shadow-2xl backdrop-blur-xl z-50 animate-fade-in space-y-1">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-white/10">
                🛠️ เครื่องมือช่วยปฏิบัติการ
              </div>

              {/* 3D Model Inspector */}
              <button
                onClick={() => {
                  toggle3DModel(true)
                  setMobileToolsOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-sky-300 hover:bg-sky-500/15 hover:text-sky-200 transition-colors text-left"
              >
                <Box size={16} className="text-sky-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-none">สำรวจคอม 3D</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">หมุนเคสจำลอง & จุดตรวจ</p>
                </div>
              </button>

              {/* Lab Map & GPS */}
              <button
                onClick={() => {
                  toggleNavigator(true)
                  setMobileToolsOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200 transition-colors text-left"
              >
                <Navigation size={16} className="text-emerald-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-none">แผนที่ & GPS แล็บ</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">ค้นหาตำแหน่งโต๊ะประจำฐาน</p>
                </div>
              </button>

              {/* Chat History */}
              <button
                onClick={() => {
                  toggleHistoryModal(true)
                  setMobileToolsOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-violet-300 hover:bg-violet-500/15 hover:text-violet-200 transition-colors text-left"
              >
                <History size={16} className="text-violet-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-none">ประวัติการสนทนา</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">ดูบันทึกแชท & ส่งออก</p>
                </div>
              </button>

              <div className="border-t border-white/10 my-1" />

              {/* Reset Chat */}
              <button
                onClick={() => {
                  resetChat()
                  setMobileToolsOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 transition-colors text-left"
              >
                <RefreshCw size={14} className="flex-shrink-0" />
                <span>รีเซ็ตบทสนทนาสถานีนี้</span>
              </button>
            </div>
          )}
        </div>

        {/* Right on Desktop (md:): Action buttons */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          {/* Chat History Button */}
          <button
            id="open-history-header-btn"
            onClick={() => toggleHistoryModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 hover:border-violet-500/50 shadow-sm transition-all duration-200 focus-ring"
            title="ประวัติการสนทนา"
            aria-label="ประวัติการสนทนา"
          >
            <History size={15} className="text-violet-400" />
            <span className="hidden lg:inline">ประวัติแชท</span>
          </button>

          {/* Activity Sheet Button */}
          <button
            id="open-worksheet-header-btn"
            onClick={() => toggleActivitySheet(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-200 focus-ring"
            title="ใบกิจกรรมสำรวจอาการเสีย"
            aria-label="ใบกิจกรรม"
          >
            <FileText size={15} className="text-emerald-400" />
            <span className="hidden lg:inline">ใบกิจกรรม</span>
          </button>

          {/* 3D Hardware Model Inspector */}
          <button
            id="open-3d-model-header-btn"
            onClick={() => toggle3DModel(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 hover:border-sky-500/50 shadow-sm transition-all duration-200 focus-ring"
            title="สำรวจคอมพิวเตอร์ 3D"
            aria-label="สำรวจคอม 3D"
          >
            <Box size={15} className="animate-bounce-dot text-sky-400" />
            <span className="hidden xl:inline">สำรวจคอม 3D</span>
          </button>

          {/* Lab GPS & Navigator button */}
          <button
            id="open-navigator-header-btn"
            onClick={() => toggleNavigator(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-200 focus-ring"
            title="แผนที่ & GPS ห้องแล็บ"
            aria-label="แผนที่ & GPS"
          >
            <Navigation size={15} className="animate-pulse" />
            <span className="hidden xl:inline">แผนที่ & GPS</span>
          </button>

          {/* Reset Chat */}
          <button
            id="reset-chat-btn"
            onClick={resetChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 border border-white/10 hover:border-red-500/30 transition-all duration-200 focus-ring"
            title="Reset conversation"
            aria-label="Reset chat"
          >
            <RefreshCw size={14} />
            <span className="hidden xl:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Station Chips Bar (< md) ── */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x px-3 py-1.5 border-t border-white/5 bg-slate-950/40">
        {STATIONS.map((station) => {
          const isActive = station.id === state.activeStationId
          return (
            <button
              key={station.id}
              id={`station-btn-mobile-${station.number}`}
              onClick={() => setStation(station.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border focus-ring flex-shrink-0',
                isActive
                  ? `${station.bgColor} ${station.borderColor} ${station.color} shadow-md ring-1 ring-emerald-500/30 font-semibold`
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              )}
              aria-pressed={isActive}
            >
              <span>{station.icon}</span>
              <span>ฐาน {station.number}:</span>
              <span>{station.titleTh}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
