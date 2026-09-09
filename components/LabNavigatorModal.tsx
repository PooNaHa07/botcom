// components/LabNavigatorModal.tsx
// Interactive Classroom 2D Lab Map & GPS Navigator Modal

'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Navigation,
  Compass,
  MapPin,
  X,
  Crosshair,
  Satellite,
  Check,
  ChevronRight,
  RefreshCw,
  LocateFixed,
  AlertTriangle,
  MoveRight,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { STATIONS } from '@/lib/stations'
import { useGeolocation } from '@/hooks/useGeolocation'
import { cn } from '@/lib/utils'

export default function LabNavigatorModal() {
  const { state, setStation, toggleNavigator } = useChat()
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!

  const {
    latitude,
    longitude,
    accuracy,
    altitude,
    timestamp,
    status: gpsStatus,
    errorMessage: gpsError,
    isSimulated,
    requestLocation,
    setSimulatedCoords,
  } = useGeolocation()

  // Student position on the 2D lab map (percentages 0-100)
  // Default is at the entrance (center bottom)
  const [studentPos, setStudentPos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 92,
  })

  // Selected station in the navigator (defaults to activeStationId)
  const [selectedStationId, setSelectedStationId] = useState(state.activeStationId)
  const targetStation = STATIONS.find((s) => s.id === selectedStationId) || activeStation

  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Sync selectedStationId with global activeStationId
  useEffect(() => {
    setSelectedStationId(state.activeStationId)
  }, [state.activeStationId])

  // Close on Escape key
  useEffect(() => {
    if (!state.navigatorOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleNavigator(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.navigatorOpen, toggleNavigator])

  // Calculate distance in simulated meters based on 2D coordinates (room is roughly 10m x 12m)
  const deltaX = targetStation.coords.x - studentPos.x
  const deltaY = targetStation.coords.y - studentPos.y
  // Distance in percentage
  const distPct = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  // Real world meter estimation (~0.12m per percentage point)
  const distanceMeters = Math.max(0.5, distPct * 0.12).toFixed(1)

  // Calculate bearing angle (0 deg = North/Up)
  const bearingAngle = Math.round(
    (Math.atan2(deltaX, -deltaY) * 180) / Math.PI + 360
  ) % 360

  const getCompassDirection = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'ทิศเหนือ (N)'
    if (deg >= 22.5 && deg < 67.5) return 'ทิศตะวันออกเฉียงเหนือ (NE)'
    if (deg >= 67.5 && deg < 112.5) return 'ทิศตะวันออก (E)'
    if (deg >= 112.5 && deg < 157.5) return 'ทิศตะวันออกเฉียงใต้ (SE)'
    if (deg >= 157.5 && deg < 202.5) return 'ทิศใต้ (S)'
    if (deg >= 202.5 && deg < 247.5) return 'ทิศตะวันตกเฉียงใต้ (SW)'
    if (deg >= 247.5 && deg < 292.5) return 'ทิศตะวันตก (W)'
    return 'ทิศตะวันตกเฉียงเหนือ (NW)'
  }

  // Handle clicking on the map to relocate student position
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return
    const rect = mapContainerRef.current.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100
    // Bound inside 5% to 95%
    const boundedX = Math.max(5, Math.min(95, Math.round(clickX)))
    const boundedY = Math.max(5, Math.min(95, Math.round(clickY)))
    setStudentPos({ x: boundedX, y: boundedY })
  }

  const isArrived = parseFloat(distanceMeters) <= 1.2

  if (!state.navigatorOpen) return null

  return (
    <div
      id="lab-navigator-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleNavigator(false)
      }}
    >
      <div
        id="lab-navigator-modal"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 overflow-hidden"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Navigation size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  ระบบนำทางห้องปฏิบัติการ & พิกัด GPS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  Lab Room 402
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ผังห้องคอมพิวเตอร์จำลองแบบ Real-time พร้อมพิกัดดาวเทียม
              </p>
            </div>
          </div>

          <button
            id="close-navigator-btn"
            onClick={() => toggleNavigator(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
            aria-label="Close navigator"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── GPS Telemetry Banner ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-950/60 border-b border-white/5 text-xs text-slate-300 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Satellite
                size={14}
                className={cn(
                  gpsStatus === 'success' ? 'text-emerald-400' : 'text-amber-400'
                )}
              />
              <span className="text-slate-400">พิกัด GPS:</span>
              <span className="font-mono font-medium text-emerald-300">
                {latitude !== null && longitude !== null
                  ? `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`
                  : 'กำลังค้นหาสัญญาณ...'}
              </span>
            </div>

            {accuracy !== null && (
              <div className="hidden sm:flex items-center gap-1 text-slate-400">
                <span>ความแม่นยำ:</span>
                <span className="font-mono text-slate-200">±{accuracy.toFixed(1)} ม.</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  gpsStatus === 'success' && !isSimulated
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-amber-400'
                )}
              />
              <span className="text-[11px] text-slate-300">
                {gpsStatus === 'loading'
                  ? 'กำลังเชื่อมต่อดาวเทียม...'
                  : isSimulated
                  ? 'พิกัดจำลองห้องแล็บ (Check-in สำเร็จ)'
                  : 'เชื่อมต่อ GPS จริงสำเร็จ'}
              </span>
            </div>
          </div>

          <button
            id="refresh-gps-btn"
            onClick={requestLocation}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
            title="อัปเดตพิกัด GPS ใหม่"
          >
            <RefreshCw size={11} className={gpsStatus === 'loading' ? 'animate-spin' : ''} />
            <span>อัปเดตพิกัด</span>
          </button>
        </div>

        {/* ── Main Content Body ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
          {/* ── Left / Top: Interactive 2D Room Blueprint Map (7 Cols) ── */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={13} className="text-emerald-400" />
                แผนผังห้องปฏิบัติการ (คลิกบนแผนที่เพื่อเปลี่ยนตำแหน่งเดิน)
              </span>
              <button
                onClick={() => setStudentPos({ x: 50, y: 92 })}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <LocateFixed size={11} />
                รีเซ็ตไปที่ประตูทางเข้า
              </button>
            </div>

            {/* Blueprint Grid Canvas Area */}
            <div
              ref={mapContainerRef}
              onClick={handleMapClick}
              id="lab-blueprint-canvas"
              className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-xl border border-emerald-500/20 bg-slate-900/90 overflow-hidden cursor-crosshair select-none group shadow-inner"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 70%),
                  linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 25px 25px, 25px 25px',
              }}
            >
              {/* Radar circular sweeps */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div className="w-[85%] h-[85%] rounded-full border border-dashed border-emerald-500/20" />
                <div className="w-[55%] h-[55%] rounded-full border border-emerald-500/20" />
                <div className="w-[25%] h-[25%] rounded-full border border-dashed border-emerald-500/20" />
              </div>

              {/* Front of room: Teacher & Projector Screen */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70%] py-1.5 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center pointer-events-none">
                <span className="text-[10px] font-semibold text-emerald-300 flex items-center justify-center gap-1">
                  🖥️ หน้าห้อง: กระดานโปรเจกเตอร์ & โต๊ะอาจารย์
                </span>
              </div>

              {/* Center Aisle Indicator */}
              <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-12 border-x border-dashed border-white/5 flex items-center justify-center pointer-events-none">
                <span className="text-[9px] text-slate-600 uppercase tracking-widest -rotate-90">
                  ทางเดินกลาง
                </span>
              </div>

              {/* Back of room: Entrance */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-slate-800/80 border border-white/10 text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                  🚪 ประตูทางเข้าห้องปฏิบัติการ
                </span>
              </div>

              {/* SVG Dynamic Navigation Waypoint Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <linearGradient id="navPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <line
                  x1={`${studentPos.x}%`}
                  y1={`${studentPos.y}%`}
                  x2={`${targetStation.coords.x}%`}
                  y2={`${targetStation.coords.y}%`}
                  stroke="url(#navPathGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>

              {/* 4 Station Markers */}
              {STATIONS.map((st) => {
                const isTarget = st.id === selectedStationId
                return (
                  <div
                    key={st.id}
                    id={`map-station-${st.number}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedStationId(st.id)
                    }}
                    style={{ left: `${st.coords.x}%`, top: `${st.coords.y}%` }}
                    className={cn(
                      'absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110'
                    )}
                  >
                    <div
                      className={cn(
                        'relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg shadow-lg transition-all',
                        isTarget
                          ? `${st.bgColor} border-2 border-emerald-400 shadow-emerald-500/30 scale-110`
                          : 'bg-slate-800/90 border border-white/20 text-slate-400 hover:border-white/40'
                      )}
                    >
                      {st.icon}
                      {isTarget && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap border',
                        isTarget
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900/80 text-slate-400 border-white/10'
                      )}
                    >
                      Station {st.number}
                    </span>
                  </div>
                )
              })}

              {/* Student Current Location Blip */}
              <div
                id="student-location-blip"
                style={{
                  left: `${studentPos.x}%`,
                  top: `${studentPos.y}%`,
                  transition: 'left 0.3s ease-out, top 0.3s ease-out',
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center"
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-emerald-500/50">
                    <Crosshair size={12} className="animate-spin" />
                  </div>
                  <div className="absolute -inset-1.5 rounded-full border border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950 shadow-md whitespace-nowrap">
                  📍 คุณอยู่ที่นี่
                </span>
              </div>
            </div>

            {/* Click-to-move hint */}
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              💡 คลิกตำแหน่งใดก็ได้ในห้องจำลองด้านบน เพื่ออัปเดตตำแหน่งของคุณและคำนวณเส้นทางใหม่
            </p>
          </div>

          {/* ── Right / Bottom: Navigation Directions & Station Info (5 Cols) ── */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-slate-900/50">
            <div className="space-y-4">
              {/* Target Station Header Card */}
              <div
                className={cn(
                  'p-3.5 rounded-xl border transition-all',
                  targetStation.bgColor,
                  targetStation.borderColor
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{targetStation.icon}</span>
                    <div>
                      <span className={cn('text-xs font-bold uppercase', targetStation.color)}>
                        เป้าหมาย: Station {targetStation.number}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {targetStation.titleTh}
                      </h3>
                      <p className="text-[10px] text-slate-400">{targetStation.titleEn}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-white/10 text-xs text-slate-300">
                  <p className="text-[11px] text-slate-400 font-medium">📍 พิกัดโซน:</p>
                  <p className="font-semibold text-emerald-300">{targetStation.zone}</p>
                </div>
              </div>

              {/* Wayfinding Metrics (Distance + Bearing) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                    ระยะห่างถึงสถานี
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {distanceMeters} ม.
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {isArrived ? '🎉 ถึงสถานีแล้ว!' : 'ประมาณการเดิน'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                    ทิศทาง (Bearing)
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <Compass size={14} className="text-sky-400" />
                    <span className="text-xl font-bold font-mono text-sky-400">
                      {bearingAngle}°
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                    {getCompassDirection(bearingAngle)}
                  </span>
                </div>
              </div>

              {/* Turn-by-Turn Steps */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MoveRight size={13} className="text-emerald-400" />
                  คำแนะนำการเดินในห้องเรียน
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-relaxed">{targetStation.directions}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-relaxed text-slate-400">
                      เมื่อถึงโต๊ะ ตรวจสอบป้ายชื่อสถานีหมายเลข {targetStation.number} และปฏิบัติตามคำแนะนำความปลอดภัย
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                id="select-and-navigate-btn"
                onClick={() => {
                  setStation(targetStation.id)
                  toggleNavigator(false)
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 focus-ring"
              >
                <Check size={16} />
                <span>เข้าสู่บทเรียน Station {targetStation.number} ทันที</span>
              </button>

              <p className="text-[10px] text-slate-500 text-center">
                กด Esc หรือคลิกภายนอกเพื่อปิดหน้าต่างแผนที่
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
