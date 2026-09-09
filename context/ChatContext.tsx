'use client'
// context/ChatContext.tsx
// Global chat state management using React Context + useReducer
// Supports: studentName, message ratings, streaming, session tracking, localStorage persistence

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react'
import { STATIONS, MISSION_STEPS } from '@/lib/stations'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MessagePart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  parts: MessagePart[]
  timestamp: number
  streaming?: boolean  // true while message is being streamed
}

export interface MissionStep {
  id: number
  label: string
  sublabel: string
  completed: boolean
}

// ─── Worksheet Structure matching the PDF ────────────────────────────────────
export interface StationWorksheet {
  observation: string        // 1. สังเกต
  problemStatement: string   // 2. ระบุปัญหา
  hypotheses: string         // 3. วิเคราะห์อย่างน้อย 3 สาเหตุ
  inspectionPlan: string     // 4. วางแผนตรวจสอบ
  actionAndEvidence: string  // 5. เสนอ/ปฏิบัติการแก้ไข (พร้อมหลักฐาน)
  verificationMethod: string // 6. ระบุวิธีทดสอบผล
  studentGroup?: string
  studentId?: string
  lastUpdated?: number
}

export interface ChatState {
  activeStationId: string
  messages: ChatMessage[]
  missionSteps: MissionStep[]
  messagesByStation: Record<string, ChatMessage[]>
  missionStepsByStation: Record<string, MissionStep[]>
  isLoading: boolean
  sidebarOpen: boolean
  navigatorOpen: boolean
  model3DOpen: boolean
  activitySheetOpen: boolean
  historyModalOpen: boolean
  studentName: string
  sessionStartTime: number
  messageRatings: Record<string, 1 | -1>
  showNameModal: boolean
  worksheetData: Record<string, StationWorksheet>
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_STATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; text: string; streaming?: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_MISSION_STEP'; payload: number }
  | { type: 'AUTO_COMPLETE_MISSION_STEP'; payload: number }
  | { type: 'RESET_CHAT' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_NAVIGATOR'; payload?: boolean }
  | { type: 'TOGGLE_3D_MODEL'; payload?: boolean }
  | { type: 'TOGGLE_ACTIVITY_SHEET'; payload?: boolean }
  | { type: 'TOGGLE_HISTORY_MODAL'; payload?: boolean }
  | { type: 'CLEAR_STATION_HISTORY'; payload: string }
  | { type: 'CLEAR_ALL_HISTORY' }
  | { type: 'LOAD_PERSISTED'; payload: Partial<ChatState> }
  | { type: 'SET_STUDENT_NAME'; payload: string }
  | { type: 'SET_MESSAGE_RATING'; payload: { id: string; rating: 1 | -1 } }
  | { type: 'SHOW_NAME_MODAL'; payload: boolean }
  | { type: 'UPDATE_WORKSHEET'; payload: { stationId: string; data: Partial<StationWorksheet> } }
  | { type: 'AUTO_FILL_WORKSHEET'; payload: { stationId: string } }

// ─── Initial State ────────────────────────────────────────────────────────────

const buildMissionSteps = (): MissionStep[] =>
  MISSION_STEPS.map((s) => ({ ...s, completed: false }))

const INITIAL_WORKSHEET: StationWorksheet = {
  observation: '',
  problemStatement: '',
  hypotheses: '',
  inspectionPlan: '',
  actionAndEvidence: '',
  verificationMethod: '',
}

const INITIAL_STATE: ChatState = {
  activeStationId: STATIONS[0].id,
  messages: [],
  missionSteps: buildMissionSteps(),
  messagesByStation: {
    'station-1': [],
    'station-2': [],
    'station-3': [],
    'station-4': [],
  },
  missionStepsByStation: {
    'station-1': buildMissionSteps(),
    'station-2': buildMissionSteps(),
    'station-3': buildMissionSteps(),
    'station-4': buildMissionSteps(),
  },
  isLoading: false,
  sidebarOpen: false,
  navigatorOpen: false,
  model3DOpen: false,
  activitySheetOpen: false,
  historyModalOpen: false,
  studentName: '',
  sessionStartTime: Date.now(),
  messageRatings: {},
  showNameModal: false,
  worksheetData: {
    'station-1': { ...INITIAL_WORKSHEET },
    'station-2': { ...INITIAL_WORKSHEET },
    'station-3': { ...INITIAL_WORKSHEET },
    'station-4': { ...INITIAL_WORKSHEET },
  },
}

// ─── Mission keyword detector (6 steps from PDF) ──────────────────────────────
// 1. สังเกต ➔ 2. ระบุปัญหา ➔ 3. วิเคราะห์อย่างน้อย 3 สาเหตุ ➔ 4. วางแผนตรวจสอบ ➔ 5. เสนอ/ปฏิบัติการแก้ไข ➔ 6. ระบุวิธีทดสอบผล

const MISSION_KEYWORDS: Record<number, string[]> = {
  1: ['สังเกต', 'symptom', 'มอง', 'พัดลม', 'ไฟ', 'เสียง', 'สายไฟ', 'หน้าจอ', 'ลองเปิด', 'เคส'],
  2: ['ปัญหาคือ', 'อาการคือ', 'ระบุปัญหา', 'problem', 'เปิดไม่ติด', 'จอมืด', 'เครื่องดับ', 'restart เอง', 'เครื่องช้า'],
  3: ['สาเหตุ', '3 สาเหตุ', 'สามสาเหตุ', 'cause', 'เพราะ', 'น่าจะ', 'อาจเกิดจาก', 'สันนิษฐาน'],
  4: ['วางแผน', 'แผนการ', 'ขั้นตอนการตรวจ', 'ตรวจก่อน', 'plan', 'ลำดับการตรวจ', 'วิธีตรวจ'],
  5: ['แก้ไข', 'ปฏิบัติการ', 'ลองทำ', 'ถอด', 'เสียบ', 'เปลี่ยน', 'ทำความสะอาด', 'แก้ปัญหา', 'action', 'fix', 'หลักฐาน'],
  6: ['วิธีทดสอบผล', 'ทดสอบผล', 'ผลการทดสอบ', 'ทดสอบ', 'เปิดติดแล้ว', 'สำเร็จ', 'สรุปผล', 'บันทึกลงใบกิจกรรม', 'ใบกิจกรรม', 'verify', 'result'],
}

function detectMissionStep(text: string): number | null {
  const lower = text.toLowerCase()
  // Check from highest step to lowest — prefer the most advanced step
  for (let step = 6; step >= 1; step--) {
    const keywords = MISSION_KEYWORDS[step]
    if (keywords && keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return step
    }
  }
  return null
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'SET_STATION': {
      const nextStationId = action.payload
      const currentStationId = state.activeStationId
      // Save current station messages and mission steps
      const updatedMessagesByStation = {
        ...state.messagesByStation,
        [currentStationId]: state.messages,
      }
      const updatedMissionStepsByStation = {
        ...state.missionStepsByStation,
        [currentStationId]: state.missionSteps,
      }
      return {
        ...state,
        activeStationId: nextStationId,
        messages: updatedMessagesByStation[nextStationId] || [],
        missionSteps: updatedMissionStepsByStation[nextStationId] || buildMissionSteps(),
        messagesByStation: updatedMessagesByStation,
        missionStepsByStation: updatedMissionStepsByStation,
        sessionStartTime: Date.now(),
      }
    }
    case 'ADD_MESSAGE': {
      const newMessages = [...state.messages.slice(-49), action.payload]
      return {
        ...state,
        messages: newMessages,
        messagesByStation: {
          ...state.messagesByStation,
          [state.activeStationId]: newMessages,
        },
      }
    }
    case 'UPDATE_MESSAGE': {
      const updatedMessages = state.messages.map((m) =>
        m.id === action.payload.id
          ? {
              ...m,
              parts: [{ text: action.payload.text }],
              streaming: action.payload.streaming ?? false,
            }
          : m
      )
      return {
        ...state,
        messages: updatedMessages,
        messagesByStation: {
          ...state.messagesByStation,
          [state.activeStationId]: updatedMessages,
        },
      }
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'TOGGLE_MISSION_STEP': {
      const nextSteps = state.missionSteps.map((step) =>
        step.id === action.payload ? { ...step, completed: !step.completed } : step
      )
      return {
        ...state,
        missionSteps: nextSteps,
        missionStepsByStation: {
          ...state.missionStepsByStation,
          [state.activeStationId]: nextSteps,
        },
      }
    }
    case 'AUTO_COMPLETE_MISSION_STEP': {
      const stepId = action.payload
      const already = state.missionSteps.find((s) => s.id === stepId)?.completed
      if (already) return state
      const nextSteps = state.missionSteps.map((step) =>
        step.id <= stepId ? { ...step, completed: true } : step
      )
      return {
        ...state,
        missionSteps: nextSteps,
        missionStepsByStation: {
          ...state.missionStepsByStation,
          [state.activeStationId]: nextSteps,
        },
      }
    }
    case 'RESET_CHAT': {
      const currentStationId = state.activeStationId
      return {
        ...state,
        messages: [],
        missionSteps: buildMissionSteps(),
        messagesByStation: {
          ...state.messagesByStation,
          [currentStationId]: [],
        },
        missionStepsByStation: {
          ...state.missionStepsByStation,
          [currentStationId]: buildMissionSteps(),
        },
        sessionStartTime: Date.now(),
        messageRatings: {},
      }
    }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'TOGGLE_NAVIGATOR':
      return {
        ...state,
        navigatorOpen: action.payload !== undefined ? action.payload : !state.navigatorOpen,
      }
    case 'TOGGLE_3D_MODEL':
      return {
        ...state,
        model3DOpen: action.payload !== undefined ? action.payload : !state.model3DOpen,
      }
    case 'TOGGLE_ACTIVITY_SHEET':
      return {
        ...state,
        activitySheetOpen: action.payload !== undefined ? action.payload : !state.activitySheetOpen,
      }
    case 'TOGGLE_HISTORY_MODAL':
      return {
        ...state,
        historyModalOpen: action.payload !== undefined ? action.payload : !state.historyModalOpen,
      }
    case 'CLEAR_STATION_HISTORY': {
      const stId = action.payload
      return {
        ...state,
        messages: state.activeStationId === stId ? [] : state.messages,
        messagesByStation: {
          ...state.messagesByStation,
          [stId]: [],
        },
      }
    }
    case 'CLEAR_ALL_HISTORY': {
      return {
        ...state,
        messages: [],
        messagesByStation: {
          'station-1': [],
          'station-2': [],
          'station-3': [],
          'station-4': [],
        },
      }
    }
    case 'UPDATE_WORKSHEET': {
      const { stationId, data } = action.payload
      const existing = state.worksheetData[stationId] || { ...INITIAL_WORKSHEET }
      return {
        ...state,
        worksheetData: {
          ...state.worksheetData,
          [stationId]: {
            ...existing,
            ...data,
            lastUpdated: Date.now(),
          },
        },
      }
    }
    case 'AUTO_FILL_WORKSHEET': {
      const { stationId } = action.payload
      const station = STATIONS.find((s) => s.id === stationId)
      if (!station) return state

      // Intelligent extraction from conversation messages
      const msgs = state.messages
      const userTexts = msgs.filter((m) => m.role === 'user').map((m) => m.parts[0]?.text || '')
      const modelTexts = msgs.filter((m) => m.role === 'model').map((m) => m.parts[0]?.text || '')
      const allText = msgs.map((m) => m.parts[0]?.text || '').join('\n')

      // Fallback/Extracted values
      const observation = userTexts.find((t) => t.length > 5 && (t.includes('เห็น') || t.includes('ไม่ติด') || t.includes('ไฟ') || t.includes('พัดลม'))) || station.situation
      const problemStatement = `ปัญหาประจำฐาน: ${station.titleTh} (${station.situation})`
      
      // Look for 3 causes mentioned in chat or suggest based on station
      const foundCauses = userTexts.find((t) => t.includes('สาเหตุ') || t.includes('เพราะ') || t.includes('1.') || t.includes('2.')) ||
        (station.id === 'station-1'
          ? '1. สายไฟหลวม/ปลั๊กไฟไม่มีกระแส\n2. สวิตช์ PSU ด้านหลังปิดอยู่\n3. สาย Power Switch ที่ Front Panel หลุด/ต่อผิด'
          : station.id === 'station-2'
          ? '1. สายสัญญาณ VGA/HDMI หลวมหรือไม่แน่น\n2. หน้าจอปิดอยู่ หรือเลือก Input Source ผิดช่อง\n3. RAM หลวมหรือขั้วสัมผัสสกปรก'
          : station.id === 'station-3'
          ? '1. CPU ร้อนเกิน (Overheat / พัดลม CPU ฝุ่นเกาะแน่น)\n2. Power Supply จ่ายไฟไม่นิ่ง\n3. RAM เกิด Error ขณะทำงานหนัก'
          : '1. Harddisk จานหมุนมี bad sector / เสื่อมสภาพ\n2. โปรแกรมเปิดพร้อม Windows (Startup) มากเกินไป\n3. RAM 4GB ไม่เพียงพอ ทำให้ระบบสลับใช้ Pagefile บนฮาร์ดดิสก์')

      const inspectionPlan = station.teacherSequence.map((step, idx) => `${idx + 1}. ${step}`).join('\n')
      
      const actionAndEvidence = userTexts.find((t) => t.includes('ตรวจ') || t.includes('ลอง') || t.includes('ถอด') || t.includes('เสียบ') || t.includes('แก้')) ||
        `ได้ปฏิบัติตามแนวทางการตรวจสอบ: ${station.teacherSequence[0]} และ ${station.teacherSequence[1]} โดยปิดเครื่องและถอดปลั๊กตามกฎความปลอดภัยก่อนลงมือ`

      const verificationMethod = userTexts.find((t) => t.includes('ติดแล้ว') || t.includes('สำเร็จ') || t.includes('ได้แล้ว')) ||
        `ทดสอบเปิดเครื่องใหม่ สังเกตการทำงานของ ${station.equipment.slice(0, 3).join(', ')} พบว่าระบบกลับมาทำงานตามปกติ`

      const existing = state.worksheetData[stationId] || { ...INITIAL_WORKSHEET }
      return {
        ...state,
        worksheetData: {
          ...state.worksheetData,
          [stationId]: {
            ...existing,
            observation: existing.observation || observation,
            problemStatement: existing.problemStatement || problemStatement,
            hypotheses: existing.hypotheses || foundCauses,
            inspectionPlan: existing.inspectionPlan || inspectionPlan,
            actionAndEvidence: existing.actionAndEvidence || actionAndEvidence,
            verificationMethod: existing.verificationMethod || verificationMethod,
            lastUpdated: Date.now(),
          },
        },
      }
    }
    case 'LOAD_PERSISTED': {
      const targetStationId = action.payload.activeStationId || state.activeStationId
      const loadedMessagesByStation: Record<string, ChatMessage[]> = {
        'station-1': action.payload.messagesByStation?.['station-1'] || [],
        'station-2': action.payload.messagesByStation?.['station-2'] || [],
        'station-3': action.payload.messagesByStation?.['station-3'] || [],
        'station-4': action.payload.messagesByStation?.['station-4'] || [],
      }
      // If legacy messages existed but no messagesByStation
      if (action.payload.messages && action.payload.messages.length > 0 && !action.payload.messagesByStation) {
        loadedMessagesByStation[targetStationId] = action.payload.messages
      }

      const loadedStepsByStation: Record<string, MissionStep[]> = {
        'station-1': action.payload.missionStepsByStation?.['station-1'] || buildMissionSteps(),
        'station-2': action.payload.missionStepsByStation?.['station-2'] || buildMissionSteps(),
        'station-3': action.payload.missionStepsByStation?.['station-3'] || buildMissionSteps(),
        'station-4': action.payload.missionStepsByStation?.['station-4'] || buildMissionSteps(),
      }

      const mergedWorksheet = {
        'station-1': { ...INITIAL_WORKSHEET, ...(action.payload.worksheetData?.['station-1'] || {}) },
        'station-2': { ...INITIAL_WORKSHEET, ...(action.payload.worksheetData?.['station-2'] || {}) },
        'station-3': { ...INITIAL_WORKSHEET, ...(action.payload.worksheetData?.['station-3'] || {}) },
        'station-4': { ...INITIAL_WORKSHEET, ...(action.payload.worksheetData?.['station-4'] || {}) },
      }

      return {
        ...state,
        ...action.payload,
        activeStationId: targetStationId,
        messages: loadedMessagesByStation[targetStationId] || [],
        messagesByStation: loadedMessagesByStation,
        missionSteps: loadedStepsByStation[targetStationId] || buildMissionSteps(),
        missionStepsByStation: loadedStepsByStation,
        navigatorOpen: false,
        model3DOpen: false,
        activitySheetOpen: false,
        historyModalOpen: false,
        isLoading: false,
        worksheetData: mergedWorksheet,
      }
    }
    case 'SET_STUDENT_NAME':
      return { ...state, studentName: action.payload, showNameModal: false }
    case 'SET_MESSAGE_RATING':
      return {
        ...state,
        messageRatings: { ...state.messageRatings, [action.payload.id]: action.payload.rating },
      }
    case 'SHOW_NAME_MODAL':
      return { ...state, showNameModal: action.payload }
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ChatContextValue {
  state: ChatState
  setStation: (id: string) => void
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, text: string, streaming?: boolean) => void
  setLoading: (v: boolean) => void
  toggleMissionStep: (id: number) => void
  autoCompleteMissionStep: (text: string) => void
  resetChat: () => void
  toggleSidebar: () => void
  toggleNavigator: (open?: boolean) => void
  toggle3DModel: (open?: boolean) => void
  toggleActivitySheet: (open?: boolean) => void
  toggleHistoryModal: (open?: boolean) => void
  clearStationHistory: (stationId: string) => void
  clearAllHistory: () => void
  updateWorksheet: (stationId: string, data: Partial<StationWorksheet>) => void
  autoFillWorksheet: (stationId: string) => void
  setStudentName: (name: string) => void
  setMessageRating: (id: string, rating: 1 | -1) => void
  showNameModal: (show: boolean) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

const STORAGE_KEY = 'comcoach-state-v2'

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE)

  // Load persisted state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ChatState>
        // Re-attach missionStep labels from source of truth
        if (parsed.missionSteps) {
          parsed.missionSteps = parsed.missionSteps.map((s) => {
            const source = MISSION_STEPS.find((m) => m.id === s.id)
            return source ? { ...source, completed: s.completed } : s
          })
        }
        // Remove streaming flag from persisted messages
        if (parsed.messages) {
          parsed.messages = parsed.messages.map((m) => ({ ...m, streaming: false }))
        }
        dispatch({ type: 'LOAD_PERSISTED', payload: parsed })

        // Show name modal if no student name
        if (!parsed.studentName) {
          dispatch({ type: 'SHOW_NAME_MODAL', payload: true })
        }
      } else {
        // First time — show name modal
        dispatch({ type: 'SHOW_NAME_MODAL', payload: true })
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Persist state to localStorage (exclude volatile state)
  useEffect(() => {
    const {
      isLoading: _il,
      showNameModal: _snm,
      navigatorOpen: _no,
      model3DOpen: _mo,
      activitySheetOpen: _ao,
      historyModalOpen: _ho,
      ...toSave
    } = state

    // Strip streaming & sanitize large inlineData to preserve localStorage quota
    const sanitizeMsg = (m: ChatMessage) => ({
      ...m,
      streaming: false,
      parts: m.parts.map((p) => {
        if (p.inlineData && p.inlineData.data && p.inlineData.data.length > 5000) {
          return {
            text: p.text || '[รูปภาพตรวจสอบฮาร์ดแวร์]',
            inlineData: { mimeType: p.inlineData.mimeType, data: '' },
          }
        }
        return p
      }),
    })

    const safeSave = {
      ...toSave,
      messages: toSave.messages.map(sanitizeMsg),
      messagesByStation: {
        'station-1': (toSave.messagesByStation['station-1'] || []).map(sanitizeMsg),
        'station-2': (toSave.messagesByStation['station-2'] || []).map(sanitizeMsg),
        'station-3': (toSave.messagesByStation['station-3'] || []).map(sanitizeMsg),
        'station-4': (toSave.messagesByStation['station-4'] || []).map(sanitizeMsg),
      },
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSave))
    } catch (err) {
      console.warn('ComCoach localStorage save warning:', err)
    }
  }, [state])

  const setStation = useCallback(
    (id: string) => dispatch({ type: 'SET_STATION', payload: id }),
    []
  )
  const addMessage = useCallback(
    (msg: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: msg }),
    []
  )
  const updateMessage = useCallback(
    (id: string, text: string, streaming?: boolean) =>
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id, text, streaming } }),
    []
  )
  const setLoading = useCallback(
    (v: boolean) => dispatch({ type: 'SET_LOADING', payload: v }),
    []
  )
  const toggleMissionStep = useCallback(
    (id: number) => dispatch({ type: 'TOGGLE_MISSION_STEP', payload: id }),
    []
  )
  const autoCompleteMissionStep = useCallback((text: string) => {
    const step = detectMissionStep(text)
    if (step) dispatch({ type: 'AUTO_COMPLETE_MISSION_STEP', payload: step })
  }, [])
  const resetChat = useCallback(() => dispatch({ type: 'RESET_CHAT' }), [])
  const toggleSidebar = useCallback(
    () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    []
  )
  const toggleNavigator = useCallback(
    (open?: boolean) => dispatch({ type: 'TOGGLE_NAVIGATOR', payload: open }),
    []
  )
  const toggle3DModel = useCallback(
    (open?: boolean) => dispatch({ type: 'TOGGLE_3D_MODEL', payload: open }),
    []
  )
  const setStudentName = useCallback(
    (name: string) => dispatch({ type: 'SET_STUDENT_NAME', payload: name }),
    []
  )
  const setMessageRating = useCallback(
    (id: string, rating: 1 | -1) =>
      dispatch({ type: 'SET_MESSAGE_RATING', payload: { id, rating } }),
    []
  )
  const toggleActivitySheet = useCallback(
    (open?: boolean) => dispatch({ type: 'TOGGLE_ACTIVITY_SHEET', payload: open }),
    []
  )
  const toggleHistoryModal = useCallback(
    (open?: boolean) => dispatch({ type: 'TOGGLE_HISTORY_MODAL', payload: open }),
    []
  )
  const clearStationHistory = useCallback(
    (stationId: string) => dispatch({ type: 'CLEAR_STATION_HISTORY', payload: stationId }),
    []
  )
  const clearAllHistory = useCallback(
    () => dispatch({ type: 'CLEAR_ALL_HISTORY' }),
    []
  )
  const updateWorksheet = useCallback(
    (stationId: string, data: Partial<StationWorksheet>) =>
      dispatch({ type: 'UPDATE_WORKSHEET', payload: { stationId, data } }),
    []
  )
  const autoFillWorksheet = useCallback(
    (stationId: string) => dispatch({ type: 'AUTO_FILL_WORKSHEET', payload: { stationId } }),
    []
  )
  const showNameModalFn = useCallback(
    (show: boolean) => dispatch({ type: 'SHOW_NAME_MODAL', payload: show }),
    []
  )

  return (
    <ChatContext.Provider
      value={{
        state,
        setStation,
        addMessage,
        updateMessage,
        setLoading,
        toggleMissionStep,
        autoCompleteMissionStep,
        resetChat,
        toggleSidebar,
        toggleNavigator,
        toggle3DModel,
        toggleActivitySheet,
        toggleHistoryModal,
        clearStationHistory,
        clearAllHistory,
        updateWorksheet,
        autoFillWorksheet,
        setStudentName,
        setMessageRating,
        showNameModal: showNameModalFn,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}
