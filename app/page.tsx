// app/page.tsx
// Root page — assembles the full ComCoach layout

import SafetyBanner from '@/components/SafetyBanner'
import StationSelector from '@/components/StationSelector'
import Sidebar from '@/components/Sidebar'
import ChatInterface from '@/components/ChatInterface'
import LabNavigatorModal from '@/components/LabNavigatorModal'
import PC3DHardwareInspector from '@/components/PC3DHardwareInspector'
import StudentNameModal from '@/components/StudentNameModal'
import ActivitySheetModal from '@/components/ActivitySheetModal'
import ChatHistoryModal from '@/components/ChatHistoryModal'

export default function Home() {
  return (
    <main
      id="comcoach-app"
      className="flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden"
    >
      {/* Student name capture modal (shown on first visit) */}
      <StudentNameModal />

      {/* Safety banner at top */}
      <SafetyBanner />

      {/* Header / Station Selector */}
      <StationSelector />

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 min-h-0 min-w-0 w-full max-w-full overflow-hidden relative">
        <Sidebar />
        <ChatInterface />
      </div>

      {/* Chat History & Archive Modal (ประวัติการสนทนา) */}
      <ChatHistoryModal />

      {/* Digital Activity Sheet Modal (ใบกิจกรรมสำรวจอาการเสีย 6 ขั้นตอน) */}
      <ActivitySheetModal />

      {/* Indoor GPS & Lab Map Navigator Modal */}
      <LabNavigatorModal />

      {/* 3D Computer Hardware Model & Fault Navigator */}
      <PC3DHardwareInspector />
    </main>
  )
}
