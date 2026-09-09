// components/ActivitySheetModal.tsx
// Digital Activity Worksheet for "กิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์"
// Supports station tabs, 6 mission recording fields, AI auto-fill from chat, and clean A4 print/export

'use client'

import { useState } from 'react'
import {
  FileText,
  X,
  Sparkles,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  User,
  Hash,
  Users,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { STATIONS, SAFETY_RULES } from '@/lib/stations'
import { cn } from '@/lib/utils'

export default function ActivitySheetModal() {
  const { state, toggleActivitySheet, updateWorksheet, autoFillWorksheet, setStudentName } = useChat()
  const [selectedStationId, setSelectedStationId] = useState(state.activeStationId)
  const [saveToast, setSaveToast] = useState(false)
  const [autoFillToast, setAutoFillToast] = useState(false)

  if (!state.activitySheetOpen) return null

  const station = STATIONS.find((s) => s.id === selectedStationId) || STATIONS[0]
  const currentData = state.worksheetData[station.id] || {
    observation: '',
    problemStatement: '',
    hypotheses: '',
    inspectionPlan: '',
    actionAndEvidence: '',
    verificationMethod: '',
  }

  const handleFieldChange = (field: keyof typeof currentData, value: string) => {
    updateWorksheet(station.id, { [field]: value })
  }

  const handleAutoFill = () => {
    autoFillWorksheet(station.id)
    setAutoFillToast(true)
    setTimeout(() => setAutoFillToast(false), 2500)
  }

  const handleSave = () => {
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  // Count how many stations have filled data
  const filledCount = STATIONS.filter((s) => {
    const d = state.worksheetData[s.id]
    return d && (d.observation || d.hypotheses || d.actionAndEvidence)
  }).length

  return (
    <div
      id="activity-sheet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worksheet-title"
    >
      <div
        id="activity-sheet-container"
        className="relative w-full max-w-5xl h-[96vh] sm:h-auto sm:max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:w-full"
      >
        {/* ── Header (Screen only) ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-white/10 bg-slate-950/80 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="worksheet-title" className="text-xs sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>ใบกิจกรรมสำรวจอาการเสีย</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  {filledCount}/4 ฐาน
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-400">
                เอกสารบันทึกภารกิจ 6 ขั้นตอนตามหลักสูตรปฏิบัติการฮาร์ดแวร์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              id="print-worksheet-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors focus-ring"
              title="พิมพ์ใบกิจกรรมออกทางเครื่องพิมพ์ หรือบันทึกเป็น PDF"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">พิมพ์ / PDF</span>
            </button>
            <button
              id="close-worksheet-modal-btn"
              onClick={() => toggleActivitySheet(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-ring"
              aria-label="Close worksheet"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Printable Formal Header (Print view) ── */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            ใบกิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี / แผนกวิชาคอมพิวเตอร์ธุรกิจและเทคโนโลยีสารสนเทศ
          </p>
          <div className="grid grid-cols-4 gap-4 text-xs border border-slate-400 p-3 rounded bg-slate-50 text-left">
            <div>
              <span className="font-bold">ชื่อ-สกุล ผู้เรียน: </span>
              <span>{state.studentName || '...................................................'}</span>
            </div>
            <div>
              <span className="font-bold">เลขที่ / รหัส: </span>
              <span>{currentData.studentId || '.......................'}</span>
            </div>
            <div>
              <span className="font-bold">กลุ่มปฏิบัติการ: </span>
              <span>{currentData.studentGroup || '.......................'}</span>
            </div>
            <div>
              <span className="font-bold">วันที่บันทึก: </span>
              <span>{new Date().toLocaleDateString('th-TH')}</span>
            </div>
          </div>
        </div>

        {/* ── Content Body (Scrollable on screen) ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Student Info Bar (Screen) */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-850/80 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 print:hidden">
            <div>
              <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                <User size={12} className="text-emerald-400" />
                ชื่อ-สกุล นักเรียน
              </label>
              <input
                id="worksheet-student-name-input"
                type="text"
                value={state.studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="ระบุชื่อ-นามสกุล..."
                className="w-full px-3 py-1.5 text-base sm:text-xs bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                <Hash size={12} className="text-sky-400" />
                เลขที่ / รหัสนักเรียน
              </label>
              <input
                id="worksheet-student-id-input"
                type="text"
                value={currentData.studentId || ''}
                onChange={(e) => handleFieldChange('studentId', e.target.value)}
                placeholder="เช่น เลขที่ 12 หรือ รหัส 6601..."
                className="w-full px-3 py-1.5 text-base sm:text-xs bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                <Users size={12} className="text-violet-400" />
                กลุ่มปฏิบัติการ / ห้อง
              </label>
              <input
                id="worksheet-student-group-input"
                type="text"
                value={currentData.studentGroup || ''}
                onChange={(e) => handleFieldChange('studentGroup', e.target.value)}
                placeholder="เช่น กลุ่ม 1 ห้อง 402..."
                className="w-full px-3 py-1.5 text-base sm:text-xs bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Station Tabs (Screen) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
            {STATIONS.map((s) => {
              const isSelected = s.id === selectedStationId
              const data = state.worksheetData[s.id]
              const hasData = data && (data.observation || data.hypotheses || data.actionAndEvidence)
              return (
                <button
                  key={s.id}
                  id={`worksheet-tab-station-${s.number}`}
                  onClick={() => setSelectedStationId(s.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border whitespace-nowrap focus-ring',
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                  )}
                >
                  <span className="text-base">{s.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold leading-tight">ฐานที่ {s.number}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{s.titleTh}</p>
                  </div>
                  {hasData && (
                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 ml-1" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Station Overview Card (from PDF) */}
          <div
            id="station-pdf-meta-box"
            className={cn(
              'p-4 rounded-xl border space-y-3',
              station.bgColor,
              station.borderColor
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-200">
                  ฐานที่ {station.number} — {station.titleTh}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  สถานการณ์: <span className="font-normal text-slate-200">{station.situation}</span>
                </h3>
              </div>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg border', station.bgColor, station.borderColor, station.color)}>
                สมรรถนะ: {station.targetCompetency}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 border-t border-white/10">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Layers size={12} className="text-amber-400" />
                  อุปกรณ์ / หลักฐานในฐาน:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {station.equipment.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Info size={12} className="text-sky-400" />
                  แนวลำดับตรวจสอบสำหรับครู:
                </p>
                <p className="text-[11px] text-sky-300 font-mono">
                  {station.teacherSequence.join(' ➔ ')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar for Worksheet Form (Auto-fill / Save) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>ภารกิจผู้เรียน 6 ขั้นตอน</span>
              <span className="hidden sm:inline text-[10px] text-slate-500 font-normal">
                (กรอกข้อมูลหรือกดปุ่มเพื่อดึงจาก AI)
              </span>
            </h4>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="auto-fill-worksheet-btn"
                onClick={handleAutoFill}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/30 transition-all focus-ring shadow-sm"
                title="ดึงข้อสรุปและขั้นตอนจากการสนทนากับ AI ลงในช่องด้านล่างให้อัตโนมัติ"
              >
                <Sparkles size={13} className="text-emerald-400 animate-pulse" />
                <span>ดึงข้อมูลจาก AI</span>
              </button>
              <button
                id="save-worksheet-btn"
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors focus-ring"
              >
                <Save size={13} />
                <span>บันทึก</span>
              </button>
            </div>
          </div>

          {/* Toast notifications */}
          {autoFillToast && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in print:hidden">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>ดึงข้อมูลและสมมติฐานจากการสนทนากับ AI ลงในใบกิจกรรมสำเร็จแล้ว! ตรวจสอบและแก้ไขเพิ่มเติมได้เลยครับ</span>
            </div>
          )}
          {saveToast && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in print:hidden">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>บันทึกข้อมูลใบกิจกรรมเรียบร้อยแล้ว (จัดเก็บในเครื่องอัตโนมัติ)</span>
            </div>
          )}

          {/* ── 6 Mission Recording Fields (Matching the PDF) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Step 1: สังเกต */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  สังเกต (Observation)
                </label>
                <span className="text-[10px] text-slate-500">สิ่งที่มองเห็น / ได้ยิน</span>
              </div>
              <textarea
                id="worksheet-field-observation"
                rows={3}
                value={currentData.observation}
                onChange={(e) => handleFieldChange('observation', e.target.value)}
                placeholder="ระบุสิ่งที่สังเกตเห็น เช่น ไม่มีไฟ LED พัดลมไม่หมุน หรือมีเสียง Beep code..."
                className="w-full p-2.5 text-base sm:text-xs bg-slate-900/90 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Step 2: ระบุปัญหา */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  ระบุปัญหา (Problem Definition)
                </label>
                <span className="text-[10px] text-slate-500">ข้อสรุปปัญหาแท้จริง</span>
              </div>
              <textarea
                id="worksheet-field-problem"
                rows={3}
                value={currentData.problemStatement}
                onChange={(e) => handleFieldChange('problemStatement', e.target.value)}
                placeholder="ระบุปัญหาให้ชัดเจน เช่น เครื่องไม่ได้รับไฟฟ้าจากภายนอก หรือ POST ไม่ผ่าน..."
                className="w-full p-2.5 text-base sm:text-xs bg-slate-900/90 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Step 3: วิเคราะห์อย่างน้อย 3 สาเหตุ */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  วิเคราะห์อย่างน้อย 3 สาเหตุ (3 Causes) *สำคัญ*
                </label>
                <span className="text-[10px] text-amber-400/80">กฎ 3 สาเหตุ</span>
              </div>
              <textarea
                id="worksheet-field-hypotheses"
                rows={4}
                value={currentData.hypotheses}
                onChange={(e) => handleFieldChange('hypotheses', e.target.value)}
                placeholder="1. สาเหตุที่หนึ่ง: ...&#10;2. สาเหตุที่สอง: ...&#10;3. สาเหตุที่สาม: ..."
                className="w-full p-2.5 text-base sm:text-xs bg-slate-900/90 border border-amber-500/30 rounded-lg text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none resize-y font-mono leading-relaxed"
              />
            </div>

            {/* Step 4: วางแผนตรวจสอบ */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  วางแผนตรวจสอบ (Inspection Plan)
                </label>
                <span className="text-[10px] text-slate-500">ลำดับก่อน-หลัง</span>
              </div>
              <textarea
                id="worksheet-field-inspection-plan"
                rows={3}
                value={currentData.inspectionPlan}
                onChange={(e) => handleFieldChange('inspectionPlan', e.target.value)}
                placeholder="ขั้นตอนที่ 1 ตรวจ... &#10;ขั้นตอนที่ 2 ตรวจ..."
                className="w-full p-2.5 text-base sm:text-xs bg-slate-900/90 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Step 5: เสนอ/ปฏิบัติการแก้ไข */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    5
                  </span>
                  เสนอ/ปฏิบัติการแก้ไข (Action & Evidence)
                </label>
                <span className="text-[10px] text-slate-500">มีหลักฐานก่อนเปลี่ยน</span>
              </div>
              <textarea
                id="worksheet-field-action"
                rows={3}
                value={currentData.actionAndEvidence}
                onChange={(e) => handleFieldChange('actionAndEvidence', e.target.value)}
                placeholder="ระบุสิ่งที่ได้ลงมือทำ พร้อมหลักฐานที่ยืนยันว่าจุดนี้คือสาเหตุ..."
                className="w-full p-2.5 text-base sm:text-xs bg-slate-900/90 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Step 6: ระบุวิธีทดสอบผล */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    6
                  </span>
                  ระบุวิธีทดสอบผล (Verification & Test)
                </label>
                <span className="text-[10px] text-slate-500">วิธีพิสูจน์ว่าปกติ</span>
              </div>
              <textarea
                id="worksheet-field-verification"
                rows={3}
                value={currentData.verificationMethod}
                onChange={(e) => handleFieldChange('verificationMethod', e.target.value)}
                placeholder="เช่น เปิดเครื่องใหม่ สังเกตพัดลมหมุน ไฟ LED ติด หน้าจอแสดงผล และบูตเข้า Windows ได้อย่างสมบูรณ์..."
                className="w-full p-2.5 text-base sm:text-xs bg-slate-900/90 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* 3.2 Safety Rules Checklist (from PDF) */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
            <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              3.2 กติกาความปลอดภัยและการทำงาน (ต้องปฏิบัติตามทุกคน)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              {SAFETY_RULES.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Print View Teacher Assessment Form */}
          <div className="hidden print:block pt-6 border-t-2 border-slate-900 space-y-4 text-xs text-slate-800">
            <div className="border border-slate-400 p-4 rounded">
              <h4 className="font-bold mb-2">ส่วนการประเมินผลสำหรับครูผู้สอน:</h4>
              <div className="grid grid-cols-5 gap-2 text-center text-[11px] mb-3">
                <div className="border border-slate-300 p-1">1. สังเกต (2 คะแนน)</div>
                <div className="border border-slate-300 p-1">2. ระบุปัญหา (2 คะแนน)</div>
                <div className="border border-slate-300 p-1">3. วิเคราะห์ 3 สาเหตุ (2 คะแนน)</div>
                <div className="border border-slate-300 p-1">4. วางแผน (2 คะแนน)</div>
                <div className="border border-slate-300 p-1">5-6. แก้ไข & ทดสอบ (2 คะแนน)</div>
              </div>
              <div className="flex justify-between items-end pt-4">
                <div>
                  <p>คะแนนรวม: ................. / 10 คะแนน</p>
                  <p>ข้อเสนอแนะ: .....................................................................................................</p>
                </div>
                <div className="text-center">
                  <p>ลงชื่อ ................................................................. ผู้ประเมิน</p>
                  <p>(.................................................................)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer (Screen only) ── */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 flex-shrink-0 print:hidden">
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-emerald-400" />
            ข้อมูลจะถูกบันทึกอัตโนมัติในเบราว์เซอร์ สามารถสั่งพิมพ์หรือบันทึกเป็น PDF เพื่อส่งครูได้
          </span>
          <div className="flex items-center gap-2">
            <button
              id="close-worksheet-footer-btn"
              onClick={() => toggleActivitySheet(false)}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-ring"
            >
              ปิดหน้าต่าง
            </button>
            <button
              id="print-worksheet-footer-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors focus-ring"
            >
              <Printer size={14} />
              <span>พิมพ์ใบกิจกรรม (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
