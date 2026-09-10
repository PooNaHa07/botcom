// components/PC3DHardwareInspector.tsx
// Interactive 3D Computer Hardware Inspector & Fault Navigator using Three.js
// Features: Ultra-detailed dual-chamber gaming PC case, spinning RGB fans, AIO liquid cooler with coolant tubes,
// triple-fan GPU with backplate, ARGB RAM lightbars, tempered glass toggle, and dynamic lighting modes.

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  Box,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Eye,
  Info,
  Layers,
  Palette,
  Maximize2,
  Shield,
  Zap,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { STATIONS } from '@/lib/stations'
import { cn } from '@/lib/utils'

// ─── Hardware Component Definitions ──────────────────────────────────────────

export interface HardwarePart {
  id: string
  nameTh: string
  nameEn: string
  icon: string
  stationIds: string[] // Which stations suspect this component
  color: number // Hex color for 3D highlight
  position: [number, number, number] // Position in 3D space
  size: [number, number, number] // Size [w, h, d]
  cameraTarget: [number, number, number] // Where camera zooms to
  cameraPos: [number, number, number] // Camera position for inspection
  description: string
  checkSteps: string[]
  evidencePrompt: string
  safetyWarning: string
  quickQuestion: string
}

export const HARDWARE_PARTS: HardwarePart[] = [
  {
    id: 'psu',
    nameTh: 'Power Supply (PSU) & สวิตช์ไฟ',
    nameEn: 'Power Supply Unit & AC Switch',
    icon: '🔌',
    stationIds: ['station-1', 'station-3'],
    color: 0xef4444, // Red
    position: [-1.2, -1.68, 0.0],
    size: [1.6, 0.9, 1.4],
    cameraTarget: [-1.2, -1.68, 0.0],
    cameraPos: [-2.6, -1.2, 2.2],
    description:
      'แปลงไฟบ้าน AC 220V เป็นไฟกระแสตรง DC (+12V, +5V, +3.3V) เลี้ยงอุปกรณ์ทั้งหมด หากเสียหรือสวิตช์ปิดอยู่ เครื่องจะไม่ติดเลย ไม่มีไฟและพัดลม',
    checkSteps: [
      'ตรวจสวิตช์ I/O ด้านหลัง PSU ว่าเปิดอยู่ที่ตำแหน่ง ( | ) หรือไม่',
      'ตรวจสายไฟ AC 3 รู เสียบแน่นกับเต้าเสียบผนังและหลังเคส',
      'ตรวจพัดลมหลัง PSU ว่าหมุนหรือมีกลิ่นไหม้ผิดปกติหรือไม่',
      'ทดสอบวัดแรงดันไฟ 24-pin และ 8-pin CPU ด้วยมัลติมิเตอร์หรือเครื่องทดสอบ PSU',
    ],
    evidencePrompt: 'ต้องมีผลทดสอบสายไฟ หรือวัดแรงดันไฟจากพาวเวอร์ซัพพลายก่อนเปลี่ยน',
    safetyWarning: 'ถอดปลั๊กทุกครั้งก่อนตรวจ ห้ามเปิดฝาครอบ PSU เด็ดขาดเพราะมีประจุไฟฟ้าแรงสูงตกค้าง',
    quickQuestion: 'ComCoach ครับ ผมตรวจสอบสวิตช์หลัง PSU และสาย AC แล้ว เสียบแน่นปกติ ควรตรวจสาย 24-pin ต่อไหมครับ?',
  },
  {
    id: 'front-panel',
    nameTh: 'สายสวิตช์เปิดเครื่อง (Power SW Header)',
    nameEn: 'Front Panel Power Switch Header',
    icon: '🔘',
    stationIds: ['station-1'],
    color: 0xf59e0b, // Amber
    position: [1.1, -1.05, -0.9],
    size: [0.6, 0.4, 0.3],
    cameraTarget: [1.1, -1.05, -0.9],
    cameraPos: [1.5, -0.6, 1.2],
    description:
      'ขั้วจัมเปอร์ที่ต่อจากปุ่มเปิดหน้าเคสลงสู่เมนบอร์ด (Front Panel Pins) หากสายหลุด หลวม หรือปุ่มกดหน้าเคสค้าง เครื่องจะไม่ตอบสนอง',
    checkSteps: [
      'ตรวจขั้วต่อ Power SW ที่มุมล่างขวาของเมนบอร์ดว่าเสียบตรงพินคู่ Power Switch หรือไม่',
      'ตรวจสายไฟเส้นเล็กว่าขาดในหรือหลุดจากขั้วหรือไม่',
      'ทดสอบสัมผัสพินเปิดเครื่องด้วยเครื่องมือเฉพาะ (โดยมีครูผู้สอนดูแลอย่างใกล้ชิด)',
    ],
    evidencePrompt: 'บันทึกรูปถ่ายตำแหน่งพิน Power SW บนบอร์ดเปรียบเทียบกับคู่มือเมนบอร์ด',
    safetyWarning: 'ห้ามใช้โลหะช็อตพินอื่นๆ โดยไม่มั่นใจ เพราะอาจทำให้ชิปบนเมนบอร์ดลัดวงจรเสียหาย',
    quickQuestion: 'ComCoach ครับ สาย Power SW หน้าเคสดูเหมือนเสียบไม่แน่น มีวิธีตรวจสอบอย่างไรให้ปลอดภัยครับ?',
  },
  {
    id: 'ram',
    nameTh: 'RAM (แรม) & สล็อต DIMM Dual-Channel',
    nameEn: 'DDR5 RGB RAM & DIMM Slots',
    icon: '💾',
    stationIds: ['station-2', 'station-3', 'station-4'],
    color: 0x3b82f6, // Blue
    position: [0.55, 0.65, -0.85],
    size: [0.5, 1.4, 0.25],
    cameraTarget: [0.55, 0.65, -0.85],
    cameraPos: [1.1, 0.9, 1.2],
    description:
      'หน่วยความจำชั่วคราวความเร็วสูง หากหน้าสัมผัสสกปรก ขั้วทองแดงเป็นคราบออกไซด์ หรือหลวม เครื่องจะติดมีไฟ พัดลมหมุน แต่จอดำสนิท',
    checkSteps: [
      'สังเกตสลักล็อกหัว-ท้ายของสล็อตแรมว่าดีดเข้าที่แน่นหนาทั้งสองฝั่งหรือไม่',
      'ถอดปลั๊กเครื่อง แล้วปลดแรมออกมาตรวจดูคราบคาร์บอน/ฝุ่นที่ขอบทองแดง',
      'ใช้ยางลบดินสอทำความสะอาดขั้วทองแดงเบาๆ แล้วเป่าเศษยางลบออกให้สะอาดหมดจด',
      'ลองสลับใส่ทีละ 1 แถวในสล็อตหลัก (Slot 2 หรือ A2) เพื่อทดสอบว่าแถวใดเสีย',
    ],
    evidencePrompt: 'ต้องตรวจสอบเสียงสัญญาณเตือน (Beep Code) หรือไฟ Debug LED บนบอร์ดก่อนสรุปว่าแรมเสีย',
    safetyWarning: 'ห้ามใช้มือเปล่าสัมผัสขั้วทองแดงเด็ดขาด ไขมันและความชื้นจะก่อคราบออกไซด์',
    quickQuestion: 'ComCoach ครับ แรมถอดออกมาแล้ว สังเกตเห็นคราบที่ขั้วทองแดง ควรใช้ยางลบดินสอทำความสะอาดอย่างไรครับ?',
  },
  {
    id: 'gpu',
    nameTh: 'การ์ดจอแยก (Triple-Fan GPU / PCIe)',
    nameEn: 'High-End Graphics Card (GPU)',
    icon: '🖥️',
    stationIds: ['station-2'],
    color: 0x8b5cf6, // Purple
    position: [0.0, -0.4, 0.1],
    size: [2.5, 0.65, 1.1],
    cameraTarget: [0.0, -0.4, 0.1],
    cameraPos: [0.2, 0.3, 2.4],
    description:
      'การ์ดประมวลผลกราฟิก หากเสียบสายจอผิดช่อง (เสียบที่บอร์ดแทนการ์ดจอ) หรือการ์ดจอหลวม จอจะไม่ติดแม้เครื่องทำงาน',
    checkSteps: [
      'ตรวจสาย HDMI / DisplayPort ว่าเสียบที่หลังการ์ดจอ (ช่องล่าง) ไม่ใช่ช่องที่เมนบอร์ด (ช่องบน)',
      'ตรวจสายไฟเลี้ยงเสริม PCIe 8-pin ว่าเสียบแน่นหนาและคลิปล็อกเข้าสนิท',
      'ตรวจการ์ดจอว่าเสียบลงล็อกช่อง PCIe x16 สุดสนิท และยึดน็อตหลังเคสแน่น',
    ],
    evidencePrompt: 'ถ่ายภาพพอร์ตหลังเครื่องเพื่อพิสูจน์ว่าเสียบสายจอตรงกับการ์ดจอที่กำลังทำงาน',
    safetyWarning: 'ปิดเครื่องและปลดสายไฟก่อนเสมอ การ์ดจออาจมีความร้อนสะสมสูงหลังจากเปิดใช้งาน',
    quickQuestion: 'ComCoach ครับ ผมสังเกตว่ามีพอร์ตจอทั้งที่เมนบอร์ดและการ์ดจอ ผมควรเสียบสายที่ช่องไหนครับ?',
  },
  {
    id: 'cpu-cooler',
    nameTh: 'ชุดน้ำระบายความร้อน CPU (AIO Liquid Cooler)',
    nameEn: 'AIO Liquid Cooler & Radiator',
    icon: '❄️',
    stationIds: ['station-3', 'station-4'],
    color: 0x10b981, // Emerald
    position: [-0.4, 0.65, -0.5],
    size: [1.2, 1.2, 0.8],
    cameraTarget: [-0.4, 0.65, -0.5],
    cameraPos: [-0.4, 1.0, 1.5],
    description:
      'บล็อกปั๊มน้ำและหม้อน้ำระบายความร้อน CPU หากปั๊มไม่ทำงาน ท่อตัน หรือซิลิโคนแห้ง เครื่องจะ Overheat อุณหภูมิพุ่งแตะ 100°C แล้วดับเองทันที',
    checkSteps: [
      'แตะท่อยางเบาๆ เพื่อรู้สึกถึงการไหลเวียนของน้ำหล่อเย็น และฟังเสียงปั๊มน้ำ',
      'ตรวจพัดลมบนหม้อน้ำด้านบนว่าหมุนระบายลมร้อนออกนอกเคสได้ดีหรือไม่',
      'ตรวจอุณหภูมิ CPU ใน BIOS หรือ HWMonitor (ปกติไม่ควรเกิน 75-80°C)',
      'ตรวจการแนบสนิทของบล็อกสัมผัสหน้า CPU และสภาพของซิลิโคนระบายความร้อน',
    ],
    evidencePrompt: 'จดบันทึกค่าอุณหภูมิ CPU Temp จากหน้าจอ BIOS เป็นหลักฐานก่อนรื้อฮีทซิงค์',
    safetyWarning: 'ห้ามรื้อชุดระบายความร้อนขณะเครื่องยังร้อน และระวังขาล็อกพัดลมหักเด็ดขาด',
    quickQuestion: 'ComCoach ครับ เครื่องเปิดได้สักพักแล้วดับเอง พัดลมหม้อน้ำหมุนช้ามาก มีวิธีตรวจเช็คอุณหภูมิอย่างไรครับ?',
  },
  {
    id: 'storage',
    nameTh: 'ฮาร์ดดิสก์ / SSD (M.2 NVMe & SATA)',
    nameEn: 'Storage (M.2 NVMe & 2.5" SSD)',
    icon: '💽',
    stationIds: ['station-4'],
    color: 0x06b6d4, // Cyan
    position: [0.1, -0.05, -0.9],
    size: [0.9, 0.4, 0.3],
    cameraTarget: [0.1, -0.05, -0.9],
    cameraPos: [0.6, 0.2, 0.9],
    description:
      'จัดเก็บระบบปฏิบัติการ Windows และข้อมูล หากฮาร์ดดิสก์มี Bad Sector หรือพื้นที่เต็ม จะทำให้เครื่องหน่วง ช้าผิดปกติ Disk 100%',
    checkSteps: [
      'เปิด Task Manager ตรวจดูแท็บ Performance ค่า Disk Active Time ว่าขึ้น 100% ค้างตลอดเวลาหรือไม่',
      'ตรวจพื้นที่ว่างของไดรฟ์ C: ว่าเหลือน้อยกว่า 10-15% หรือไม่',
      'ตรวจสุขภาพของไดรฟ์ (S.M.A.R.T. Health) ด้วยโปรแกรม CrystalDiskInfo',
    ],
    evidencePrompt: 'แคปเจอร์ภาพ Task Manager แท็บ Performance Disk 100% แนบให้ ComCoach ตรวจสอบ',
    safetyWarning: 'อย่าเคาะ ขยับ หรือกระทบกระเทือนเคสขณะเครื่องทำงาน โดยเฉพาะอย่างยิ่งหากเป็น HDD จานหมุน',
    quickQuestion: 'ComCoach ครับ เปิด Task Manager แล้วเห็นช่อง Disk ขึ้น 100% ตลอดเวลาเลย เกิดจากอะไรได้บ้างครับ?',
  },
]

type LightingMode = 'spectrum' | 'emerald' | 'blue' | 'diagnostics'

export default function PC3DHardwareInspector() {
  const { state, toggle3DModel, setStation, addMessage } = useChat()
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedPartId, setSelectedPartId] = useState<string>(() => {
    const suspect = HARDWARE_PARTS.find((p) => p.stationIds.includes(state.activeStationId))
    return suspect ? suspect.id : HARDWARE_PARTS[0].id
  })
  const [isRotating, setIsRotating] = useState(true)
  const [viewMode, setViewMode] = useState<'normal' | 'wireframe'>('normal')
  const [showGlass, setShowGlass] = useState(true)
  const [lightingMode, setLightingMode] = useState<LightingMode>('spectrum')

  const selectedPart = HARDWARE_PARTS.find((p) => p.id === selectedPartId) || HARDWARE_PARTS[0]

  // Update selected part when station changes
  useEffect(() => {
    const suspect = HARDWARE_PARTS.find((p) => p.stationIds.includes(state.activeStationId))
    if (suspect) setSelectedPartId(suspect.id)
  }, [state.activeStationId])

  // Camera animation target refs
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 5.2))
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const sceneRef = useRef<THREE.Scene | null>(null)
  const meshGroupRef = useRef<THREE.Group | null>(null)
  const glassPanelRef = useRef<THREE.Mesh | null>(null)

  // Animated elements refs
  const animatedFansRef = useRef<THREE.Mesh[]>([])
  const rgbElementsRef = useRef<{ mesh: THREE.Mesh; baseHue: number }[]>([])
  const pointLightInternalRef = useRef<THREE.PointLight | null>(null)
  const pointLightSubRef = useRef<THREE.PointLight | null>(null)

  // Close on Escape key
  useEffect(() => {
    if (!state.model3DOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggle3DModel(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.model3DOpen, toggle3DModel])

  // Set camera target when selected part changes
  useEffect(() => {
    if (!selectedPart) return
    targetCamPos.current.set(...selectedPart.cameraPos)
    targetLookAt.current.set(...selectedPart.cameraTarget)
  }, [selectedPart])

  // Camera preset handlers
  const setCameraPreset = (preset: 'overview' | 'interior' | 'core' | 'gpu' | 'rear') => {
    switch (preset) {
      case 'overview':
        targetCamPos.current.set(0, 0.3, 5.4)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'interior':
        targetCamPos.current.set(0.2, 0.1, 2.6)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'core':
        targetCamPos.current.set(0.0, 0.8, 1.8)
        targetLookAt.current.set(0, 0.5, -0.6)
        break
      case 'gpu':
        targetCamPos.current.set(0.1, -0.2, 2.4)
        targetLookAt.current.set(0, -0.4, 0.2)
        break
      case 'rear':
        targetCamPos.current.set(-3.2, 0.0, 1.8)
        targetLookAt.current.set(-1.8, 0, 0)
        break
    }
  }

  // Toggle glass panel visibility
  useEffect(() => {
    if (glassPanelRef.current) {
      glassPanelRef.current.visible = showGlass
    }
  }, [showGlass])

  // ─── Three.js Scene Setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (!state.model3DOpen || !canvasRef.current) return

    const canvas = canvasRef.current
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x020617) // Ultra-dark Slate 950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 5.4)
    cameraRef.current = camera

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    // 3. Lighting System
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.6)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2)
    keyLight.position.set(5, 7, 6)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x0f766e, 1.2)
    fillLight.position.set(-6, -2, -4)
    scene.add(fillLight)

    // Internal ARGB Point Lights
    const internalLight = new THREE.PointLight(0x38bdf8, 2.8, 7)
    internalLight.position.set(0, 0.8, 0.2)
    scene.add(internalLight)
    pointLightInternalRef.current = internalLight

    const subInternalLight = new THREE.PointLight(0xa855f7, 2.0, 6)
    subInternalLight.position.set(0.5, -0.6, 0.4)
    scene.add(subInternalLight)
    pointLightSubRef.current = subInternalLight

    // Subtle Ground Grid Pedestal
    const gridHelper = new THREE.GridHelper(12, 24, 0x1e293b, 0x0f172a)
    gridHelper.position.y = -2.32
    scene.add(gridHelper)

    // 4. Master PC Group
    const pcGroup = new THREE.Group()
    meshGroupRef.current = pcGroup
    scene.add(pcGroup)

    const fansList: THREE.Mesh[] = []
    const rgbList: { mesh: THREE.Mesh; baseHue: number }[] = []
    const partsMap = new Map<string, THREE.Mesh>()

    // Common Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.85,
    })

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.9,
    })

    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.8,
    })

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.4,
      metalness: 0.9,
    })

    const moboPCBMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Dark cyber forest
      roughness: 0.4,
      metalness: 0.3,
    })

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
    })

    // ── 4.1 PC Case Chassis & PSU Shroud ───────────────────────────────────
    // Back Wall
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.4, 0.08), chassisMat)
    backPanel.position.set(0, 0, -1.18)
    pcGroup.add(backPanel)

    // Top Ceiling with Fan Grill
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.4), chassisMat)
    topPanel.position.set(0, 2.2, 0)
    pcGroup.add(topPanel)

    // Top Magnetic Mesh Dust Filter
    const dustFilter = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.02, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 })
    )
    dustFilter.position.set(0, 2.25, 0)
    pcGroup.add(dustFilter)

    // Bottom Floor
    const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.4), chassisMat)
    bottomPanel.position.set(0, -2.2, 0)
    pcGroup.add(bottomPanel)

    // 4 Case Feet with rubber pads
    const footGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.16, 16)
    const footMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    const footPositions: [number, number, number][] = [
      [-1.8, -2.28, -0.9],
      [1.8, -2.28, -0.9],
      [-1.8, -2.28, 0.9],
      [1.8, -2.28, 0.9],
    ]
    footPositions.forEach(([x, y, z]) => {
      const foot = new THREE.Mesh(footGeom, footMat)
      foot.position.set(x, y, z)
      pcGroup.add(foot)
    })

    // Front Bezel (Front Panel)
    const frontBezel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.4, 2.4), chassisMat)
    frontBezel.position.set(2.1, 0, 0)
    pcGroup.add(frontBezel)

    // Rear Frame with I/O Cutout
    const rearFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.4, 2.4), chassisMat)
    rearFrame.position.set(-2.1, 0, 0)
    pcGroup.add(rearFrame)

    // PSU Basement / Shroud (separates lower PSU chamber from mainboard chamber)
    const psuShroud = new THREE.Mesh(new THREE.BoxGeometry(4.16, 0.85, 2.34), darkMetalMat)
    psuShroud.position.set(0, -1.74, 0)
    pcGroup.add(psuShroud)

    // PSU Shroud Cutout Window (shows PSU label & brand)
    const shroudWindow = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 })
    )
    shroudWindow.position.set(-1.2, -1.68, 1.18)
    pcGroup.add(shroudWindow)

    // Tempered Glass Side Panel (Removable via state toggle)
    const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(4.16, 4.36, 0.04), glassMat)
    glassPanel.position.set(0, 0, 1.2)
    glassPanelRef.current = glassPanel
    pcGroup.add(glassPanel)

    // ── 4.2 Motherboard (High-End ATX Dark Edition) ────────────────────────
    const mobo = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.2, 0.08), moboPCBMat)
    mobo.position.set(-0.15, 0.15, -1.08)
    pcGroup.add(mobo)

    // VRM Heatsinks (Brushed gunmetal blocks around CPU socket)
    const vrmTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.25), darkMetalMat)
    vrmTop.position.set(-0.4, 1.4, -0.92)
    pcGroup.add(vrmTop)

    const vrmLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.25), darkMetalMat)
    vrmLeft.position.set(-1.15, 0.7, -0.92)
    pcGroup.add(vrmLeft)

    // Rear I/O Armor Shroud with glowing RGB line
    const ioShroud = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.35), darkMetalMat)
    ioShroud.position.set(-1.55, 0.4, -0.88)
    pcGroup.add(ioShroud)

    const ioAccentRgb = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.8, 0.04),
      new THREE.MeshStandardMaterial({ emissive: 0x38bdf8, emissiveIntensity: 1.2 })
    )
    ioAccentRgb.position.set(-1.38, 0.4, -0.7)
    pcGroup.add(ioAccentRgb)
    rgbList.push({ mesh: ioAccentRgb, baseHue: 0.55 })

    // Chipset PCH Heatsink (Lower right of mobo)
    const chipsetHeatsink = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.18), darkMetalMat)
    chipsetHeatsink.position.set(0.9, -0.9, -0.96)
    pcGroup.add(chipsetHeatsink)

    // Solid Capacitors array
    const capGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12)
    const capMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    for (let i = 0; i < 6; i++) {
      const cap = new THREE.Mesh(capGeom, capMat)
      cap.position.set(-0.85 + (i % 3) * 0.15, 1.15 - Math.floor(i / 3) * 0.18, -0.95)
      pcGroup.add(cap)
    }

    // Steel-Reinforced PCIe x16 Slot
    const pcieSteel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.15), aluminumMat)
    pcieSteel.position.set(-0.15, -0.38, -0.98)
    pcGroup.add(pcieSteel)

    // Secondary PCIe Slots
    for (let i = 1; i <= 2; i++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.12), darkMetalMat)
      slot.position.set(-0.15, -0.38 - i * 0.35, -0.98)
      pcGroup.add(slot)
    }

    // ── 4.3 Case Fans (Rear Exhaust & Front Dual Intakes) ──────────────────
    // Helper to create detailed 120mm RGB Fan
    const createRgbFan = (radius: number, depth: number, color: number) => {
      const fanGroup = new THREE.Group()

      // Outer Frame
      const frameGeom = new THREE.BoxGeometry(radius * 2.1, radius * 2.1, depth)
      const frameMesh = new THREE.Mesh(frameGeom, darkMetalMat)
      fanGroup.add(frameMesh)

      // Inner RGB Ring
      const ringGeom = new THREE.TorusGeometry(radius * 0.92, 0.04, 16, 32)
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      })
      const ringMesh = new THREE.Mesh(ringGeom, ringMat)
      fanGroup.add(ringMesh)
      rgbList.push({ mesh: ringMesh, baseHue: 0.6 })

      // Rotating Blades Hub
      const bladeHub = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, depth * 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      )
      bladeHub.rotation.x = Math.PI / 2

      // 7 Curved Fan Blades
      const bladeGeom = new THREE.BoxGeometry(radius * 0.65, 0.03, depth * 0.6)
      const bladeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.6,
        roughness: 0.1,
      })
      for (let b = 0; b < 7; b++) {
        const blade = new THREE.Mesh(bladeGeom, bladeMat)
        const angle = (b / 7) * Math.PI * 2
        blade.position.set(Math.cos(angle) * radius * 0.45, Math.sin(angle) * radius * 0.45, 0)
        blade.rotation.z = angle + 0.35
        bladeHub.add(blade)
      }

      fanGroup.add(bladeHub)
      fansList.push(bladeHub)

      return fanGroup
    }

    // Rear 120mm Exhaust Fan
    const rearFan = createRgbFan(0.48, 0.15, 0x38bdf8)
    rearFan.position.set(-1.85, 0.8, -0.6)
    rearFan.rotation.y = Math.PI / 2
    pcGroup.add(rearFan)

    // Dual Front 140mm Intake Fans
    const frontFan1 = createRgbFan(0.55, 0.15, 0x10b981)
    frontFan1.position.set(1.95, 0.8, 0.0)
    frontFan1.rotation.y = -Math.PI / 2
    pcGroup.add(frontFan1)

    const frontFan2 = createRgbFan(0.55, 0.15, 0x10b981)
    frontFan2.position.set(1.95, -0.5, 0.0)
    frontFan2.rotation.y = -Math.PI / 2
    pcGroup.add(frontFan2)

    // ── 4.4 Interactive Hardware Parts (Raycastable & Highlightable) ───────
    HARDWARE_PARTS.forEach((part) => {
      const isSuspect = part.stationIds.includes(state.activeStationId)

      // Base part mesh (acting as hit box / anchor)
      const hitGeom = new THREE.BoxGeometry(...part.size)
      const hitMat = new THREE.MeshStandardMaterial({
        color: isSuspect ? part.color : 0x334155,
        wireframe: viewMode === 'wireframe',
        transparent: true,
        opacity: viewMode === 'wireframe' ? 0.8 : 0.01,
        roughness: 0.3,
      })
      const partHitMesh = new THREE.Mesh(hitGeom, hitMat)
      partHitMesh.position.set(...part.position)
      partHitMesh.name = part.id
      pcGroup.add(partHitMesh)
      partsMap.set(part.id, partHitMesh)

      // Specialized high-detail 3D geometry for each component:

      // ── A. POWER SUPPLY (PSU) ──
      if (part.id === 'psu') {
        const psuBox = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.85, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.4, metalness: 0.8 })
        )
        partHitMesh.add(psuBox)

        // Rear AC socket & rocker switch
        const acSocket = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.28, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        )
        acSocket.position.set(-0.81, 0.1, -0.3)
        partHitMesh.add(acSocket)

        const psuSwitch = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.18, 0.14),
          new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xef4444,
            emissiveIntensity: 1.5,
          })
        )
        psuSwitch.position.set(-0.81, 0.1, 0.2)
        partHitMesh.add(psuSwitch)
        rgbList.push({ mesh: psuSwitch, baseHue: 0.0 })

        // Braided Main Cable Loom
        const cableLoom = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 0.9, 12),
          new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 })
        )
        cableLoom.position.set(0.65, 0.35, 0.2)
        cableLoom.rotation.z = Math.PI / 4
        partHitMesh.add(cableLoom)
      }

      // ── B. FRONT PANEL POWER SW HEADER ──
      if (part.id === 'front-panel') {
        const headerBlock = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.25, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        )
        partHitMesh.add(headerBlock)

        // Golden jumper pins
        for (let p = 0; p < 8; p++) {
          const pin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
          )
          pin.position.set(-0.14 + (p % 4) * 0.09, 0.12, -0.04 + Math.floor(p / 4) * 0.08)
          partHitMesh.add(pin)
        }

        // Twisted colored front panel wires (Red/White/Black)
        const wire1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        )
        wire1.position.set(0.05, -0.15, 0.05)
        wire1.rotation.z = -Math.PI / 3
        partHitMesh.add(wire1)
      }

      // ── C. RAM (DUAL-CHANNEL DDR5 ARGB MODULES) ──
      if (part.id === 'ram') {
        for (let s = 0; s < 2; s++) {
          const xOff = (s - 0.5) * 0.25

          // Black metallic heatspreader
          const ramBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 1.25, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.85 })
          )
          ramBody.position.set(xOff, 0, 0)
          partHitMesh.add(ramBody)

          // Silver accent badge
          const ramBadge = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.4, 0.6),
            aluminumMat
          )
          ramBadge.position.set(xOff, -0.1, 0)
          partHitMesh.add(ramBadge)

          // Glowing ARGB Top Lightbar
          const ramLightbar = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.14, 0.82),
            new THREE.MeshStandardMaterial({
              color: isSuspect ? part.color : 0x38bdf8,
              emissive: isSuspect ? part.color : 0x38bdf8,
              emissiveIntensity: 1.8,
              roughness: 0.1,
            })
          )
          ramLightbar.position.set(xOff, 0.65, 0)
          partHitMesh.add(ramLightbar)
          rgbList.push({ mesh: ramLightbar, baseHue: 0.5 + s * 0.15 })
        }
      }

      // ── D. TRIPLE-FAN GRAPHICS CARD (GPU) ──
      if (part.id === 'gpu') {
        // Main Shroud
        const gpuShroud = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.55, 0.95),
          new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.85 })
        )
        partHitMesh.add(gpuShroud)

        // Aluminum Heatsink Fin Stack (Silver sides)
        const finStack = new THREE.Mesh(
          new THREE.BoxGeometry(2.3, 0.42, 0.85),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.9 })
        )
        finStack.position.set(0, 0, -0.04)
        partHitMesh.add(finStack)

        // Metal Backplate on Top
        const backplate = new THREE.Mesh(
          new THREE.BoxGeometry(2.38, 0.04, 0.94),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.9 })
        )
        backplate.position.set(0, 0.28, 0)
        partHitMesh.add(backplate)

        // Triple GPU Fans
        for (let f = 0; f < 3; f++) {
          const fx = -0.75 + f * 0.75
          const gpuFanHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16),
            new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.9 })
          )
          gpuFanHub.position.set(fx, -0.05, 0.48)
          gpuFanHub.rotation.x = Math.PI / 2

          // 9 Curved Blades per fan
          const gpuBladeGeom = new THREE.BoxGeometry(0.24, 0.02, 0.06)
          const gpuBladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
          for (let b = 0; b < 9; b++) {
            const blade = new THREE.Mesh(gpuBladeGeom, gpuBladeMat)
            const ang = (b / 9) * Math.PI * 2
            blade.position.set(Math.cos(ang) * 0.16, Math.sin(ang) * 0.16, 0)
            blade.rotation.z = ang + 0.3
            gpuFanHub.add(blade)
          }

          partHitMesh.add(gpuFanHub)
          fansList.push(gpuFanHub)
        }

        // Side Illuminated Brand Logo ("GEFORCE RTX")
        const gpuLogo = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.12, 0.04),
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: 1.6,
          })
        )
        gpuLogo.position.set(0.3, 0.15, 0.49)
        partHitMesh.add(gpuLogo)
        rgbList.push({ mesh: gpuLogo, baseHue: 0.35 })

        // Braided 8-Pin PCIe Power Cables plugged into top edge
        const pcieCables = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.25, 0.18),
          new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 })
        )
        pcieCables.position.set(0.7, 0.36, 0.25)
        partHitMesh.add(pcieCables)
      }

      // ── E. AIO CPU LIQUID COOLER & RADIATOR ──
      if (part.id === 'cpu-cooler') {
        // Cylindrical CPU Pump Block
        const pumpBlock = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.35, 24),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
        )
        pumpBlock.rotation.x = Math.PI / 2
        pumpBlock.position.set(0, 0, 0.1)
        partHitMesh.add(pumpBlock)

        // Glowing RGB Infinity Ring on Pump Face
        const pumpRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.04, 16, 32),
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: 1.8,
          })
        )
        pumpRing.position.set(0, 0, 0.28)
        partHitMesh.add(pumpRing)
        rgbList.push({ mesh: pumpRing, baseHue: 0.38 })

        // Dual Sleeved Coolant Tubes connecting pump block to top ceiling
        const tubeGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 16)
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7 })

        const tube1 = new THREE.Mesh(tubeGeom, tubeMat)
        tube1.position.set(-0.25, 0.75, 0.1)
        tube1.rotation.z = -0.25
        partHitMesh.add(tube1)

        const tube2 = new THREE.Mesh(tubeGeom, tubeMat)
        tube2.position.set(0.15, 0.75, 0.05)
        tube2.rotation.z = 0.22
        partHitMesh.add(tube2)
      }

      // ── F. STORAGE (M.2 NVME & 2.5" SSD) ──
      if (part.id === 'storage') {
        // M.2 NVMe SSD Module
        const m2Pcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.24, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x047857 })
        )
        partHitMesh.add(m2Pcb)

        // Aluminum M.2 Heatsink Armor
        const m2Heatsink = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 0.22, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
        )
        m2Heatsink.position.set(0, 0, 0.04)
        partHitMesh.add(m2Heatsink)

        // Gold Contact Pins
        const m2Gold = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.18, 0.02),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95 })
        )
        m2Gold.position.set(-0.42, 0, 0.01)
        partHitMesh.add(m2Gold)

        // Status Activity LED
        const storageLed = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.03, 0.02),
          new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 2.0,
          })
        )
        storageLed.position.set(0.32, 0.08, 0.06)
        partHitMesh.add(storageLed)
        rgbList.push({ mesh: storageLed, baseHue: 0.52 })
      }
    })

    animatedFansRef.current = fansList
    rgbElementsRef.current = rgbList

    // ── 5. Mouse Drag & Orbit Controls ────────────────────────────────────────
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !pcGroup) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      pcGroup.rotation.y += deltaX * 0.008
      pcGroup.rotation.x = Math.max(-0.6, Math.min(0.6, pcGroup.rotation.x + deltaY * 0.008))
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (!cameraRef.current) return
      const fov = cameraRef.current.fov + e.deltaY * 0.03
      cameraRef.current.fov = Math.max(25, Math.min(65, fov))
      cameraRef.current.updateProjectionMatrix()
    }

    // Touch gesture support for mobile devices
    let touchStartX = 0
    let touchStartY = 0
    let prevTouchX = 0
    let prevTouchY = 0
    let initialPinchDist = 0
    let isTouchDragging = false
    let touchMoved = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isTouchDragging = true
        touchMoved = false
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        prevTouchX = e.touches[0].clientX
        prevTouchY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        isTouchDragging = false
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pcGroup) return

      if (e.touches.length === 1 && isTouchDragging) {
        const curX = e.touches[0].clientX
        const curY = e.touches[0].clientY
        const deltaX = curX - prevTouchX
        const deltaY = curY - prevTouchY

        if (Math.abs(curX - touchStartX) > 5 || Math.abs(curY - touchStartY) > 5) {
          touchMoved = true
        }

        pcGroup.rotation.y += deltaX * 0.009
        pcGroup.rotation.x = Math.max(-0.6, Math.min(0.6, pcGroup.rotation.x + deltaY * 0.009))
        prevTouchX = curX
        prevTouchY = curY
      } else if (e.touches.length === 2 && cameraRef.current) {
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const diff = initialPinchDist - curDist
        const fov = cameraRef.current.fov + diff * 0.08
        cameraRef.current.fov = Math.max(25, Math.min(65, fov))
        cameraRef.current.updateProjectionMatrix()
        initialPinchDist = curDist
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (isTouchDragging && !touchMoved && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0]
        const rect = canvas.getBoundingClientRect()
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(pcGroup.children, true)

        for (const hit of intersects) {
          let current: THREE.Object3D | null = hit.object
          while (current && current !== pcGroup) {
            if (partsMap.has(current.name)) {
              setSelectedPartId(current.name)
              break
            }
            current = current.parent
          }
        }
      }
      isTouchDragging = false
    }

    // Raycaster for clicking 3D parts
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(pcGroup.children, true)

      for (const hit of intersects) {
        let current: THREE.Object3D | null = hit.object
        while (current && current !== pcGroup) {
          if (partsMap.has(current.name)) {
            setSelectedPartId(current.name)
            return
          }
          current = current.parent
        }
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('click', onCanvasClick)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    // ── 6. Dynamic Animation Loop (Fans & ARGB Engine) ────────────────────────
    let animId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      // Rotate all cooling fans (CPU, GPU, Case fans)
      animatedFansRef.current.forEach((fan, idx) => {
        fan.rotation.z += 0.08 + (idx % 3) * 0.015
      })

      // Dynamic ARGB Color Cycling Engine
      rgbElementsRef.current.forEach(({ mesh, baseHue }) => {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (!mat || !mat.emissive) return

        let targetColor = new THREE.Color()

        if (lightingMode === 'spectrum') {
          // Flowing rainbow wave
          targetColor.setHSL((time * 0.2 + baseHue) % 1.0, 0.95, 0.55)
        } else if (lightingMode === 'emerald') {
          // Cyberpunk emerald & teal pulse
          const pulse = (Math.sin(time * 2.0 + baseHue * Math.PI) + 1) * 0.5
          targetColor.setHSL(0.42, 0.9, 0.35 + pulse * 0.25)
        } else if (lightingMode === 'blue') {
          // Neon Ice Cyan & Royal Blue
          const pulse = (Math.cos(time * 1.8 + baseHue * Math.PI) + 1) * 0.5
          targetColor.setHSL(0.55 + pulse * 0.08, 0.95, 0.5)
        } else if (lightingMode === 'diagnostics') {
          // Alert Pulse (Red & Amber warning)
          const pulse = (Math.sin(time * 4.0) + 1) * 0.5
          targetColor.setHSL(0.02 + pulse * 0.08, 1.0, 0.5)
        }

        mat.color.copy(targetColor)
        mat.emissive.copy(targetColor)
      })

      // Internal point lights color modulation
      if (pointLightInternalRef.current) {
        if (lightingMode === 'spectrum') {
          pointLightInternalRef.current.color.setHSL((time * 0.15) % 1.0, 0.9, 0.6)
        } else if (lightingMode === 'emerald') {
          pointLightInternalRef.current.color.setHex(0x10b981)
        } else if (lightingMode === 'blue') {
          pointLightInternalRef.current.color.setHex(0x06b6d4)
        } else if (lightingMode === 'diagnostics') {
          pointLightInternalRef.current.color.setHex(0xf59e0b)
        }
      }

      // Idle Rotation
      if (isRotating && !isDragging && !isTouchDragging && pcGroup) {
        pcGroup.rotation.y += 0.002
      }

      // Camera Smooth Interpolation (Lerp)
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.065)
        currentLookAt.current.lerp(targetLookAt.current, 0.065)
        cameraRef.current.lookAt(currentLookAt.current)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      if (!canvas || !cameraRef.current) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('click', onCanvasClick)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [state.model3DOpen, isRotating, viewMode, lightingMode, state.activeStationId])

  // Ask ComCoach about this inspected part
  const handleAskCoach = () => {
    addMessage({
      id: `${Date.now()}-user-part`,
      role: 'user',
      parts: [{ text: selectedPart.quickQuestion }],
      timestamp: Date.now(),
    })
    toggle3DModel(false)
  }

  if (!state.model3DOpen) return null

  return (
    <div
      id="pc-3d-inspector-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggle3DModel(false)
      }}
    >
      <div
        id="pc-3d-inspector-modal"
        className="relative w-full max-w-6xl h-[95vh] sm:h-auto sm:max-h-[94vh] flex flex-col rounded-xl sm:rounded-2xl bg-slate-900 border border-sky-500/30 shadow-2xl shadow-sky-950/50 overflow-hidden"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 bg-slate-900/95 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-sky-500/30 to-emerald-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-sm">
              <Box size={18} className="animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                  <span>โมเดล 3D จำลองคอมพิวเตอร์</span>
                  <span className="hidden sm:inline text-xs font-normal text-slate-400">
                    (Gaming Rig & Hardware Inspector)
                  </span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  PRO 3D
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                หมุนดูภายในเคส ปรับแสง RGB ถอดฝากระจก หรือแตะชิ้นส่วนเพื่อซูมตรวจสอบ
              </p>
            </div>
          </div>

          <button
            id="close-3d-modal-btn"
            onClick={() => toggle3DModel(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-ring flex-shrink-0"
            aria-label="Close 3D model"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Active Station Context Strip ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-5 py-1.5 sm:py-2 bg-slate-950/80 border-b border-white/5 text-xs gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] sm:text-xs">สถานีที่กำลังปฏิบัติการ:</span>
            <span className={cn('font-bold flex items-center gap-1 text-[11px] sm:text-xs', activeStation.color)}>
              <span>{activeStation.icon}</span>
              <span>
                ฐานที่ {activeStation.number}: {activeStation.titleTh}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-[11px]">
            <Sparkles size={12} className="text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="truncate">
              ชิ้นส่วนต้องสงสัยของฐานนี้จะเรืองแสงเด่นชัด | คลิกที่ชิ้นส่วนเพื่อวินิจฉัย
            </span>
          </div>
        </div>

        {/* ── Main 3D Canvas + Diagnosis Split ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
          {/* ── Left / Center: Interactive 3D Viewport (7-8 Cols) ── */}
          <div className="lg:col-span-7 xl:col-span-8 relative flex flex-col bg-slate-950 min-h-[300px] sm:min-h-[400px] lg:min-h-[520px]">
            {/* 3D WebGL Canvas */}
            <canvas
              ref={canvasRef}
              id="pc-3d-canvas"
              className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
            />

            {/* ── 3D Viewport Top HUD Controls ── */}
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 sm:gap-1.5 z-10 pointer-events-auto max-w-[calc(100%-20px)]">
              {/* Camera Presets */}
              <div className="flex items-center bg-slate-900/85 backdrop-blur-md rounded-xl border border-white/10 p-0.5 shadow-lg">
                <button
                  onClick={() => setCameraPreset('overview')}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="มุมมองรวมทั้งหมด (3/4 Isometric)"
                >
                  รวม
                </button>
                <button
                  onClick={() => setCameraPreset('interior')}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="มองเจาะเข้าภายในเคส"
                >
                  ภายใน
                </button>
                <button
                  onClick={() => setCameraPreset('core')}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="โฟกัส CPU & RAM"
                >
                  CPU/RAM
                </button>
                <button
                  onClick={() => setCameraPreset('gpu')}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="โฟกัสการ์ดจอ"
                >
                  การ์ดจอ
                </button>
                <button
                  onClick={() => setCameraPreset('rear')}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="หลังเคส & พอร์ตเชื่อมต่อ"
                >
                  หลังเคส
                </button>
              </div>

              {/* Auto Rotate Toggle */}
              <button
                onClick={() => setIsRotating((v) => !v)}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium border backdrop-blur-md transition-all flex items-center gap-1 shadow-lg',
                  isRotating
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-slate-900/85 text-slate-400 border-white/10'
                )}
                title="เปิด/ปิดการหมุนอัตโนมัติ"
              >
                <RotateCw size={11} className={isRotating ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRotating ? 'หมุน: เปิด' : 'หมุน: ปิด'}</span>
              </button>

              {/* Toggle Side Glass Panel */}
              <button
                onClick={() => setShowGlass((v) => !v)}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium border backdrop-blur-md transition-all flex items-center gap-1 shadow-lg',
                  showGlass
                    ? 'bg-slate-900/85 text-slate-300 border-white/10'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                )}
                title="ถอดฝากระจกข้างเพื่อมองเห็นอุปกรณ์ชัดเจน"
              >
                <Shield size={11} />
                <span>{showGlass ? 'ถอดฝากระจก' : 'ใส่ฝากระจก'}</span>
              </button>

              {/* RGB Lighting Mode Selector */}
              <div className="flex items-center bg-slate-900/85 backdrop-blur-md rounded-xl border border-white/10 p-0.5 shadow-lg">
                <span className="text-[10px] text-slate-500 pl-1.5 pr-1 flex items-center gap-1">
                  <Palette size={10} />
                  <span className="hidden md:inline">ไฟ:</span>
                </span>
                <button
                  onClick={() => setLightingMode('spectrum')}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors',
                    lightingMode === 'spectrum'
                      ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                  title="ไฟ RGB รุ้งไหลแบบ Spectrum"
                >
                  RGB
                </button>
                <button
                  onClick={() => setLightingMode('emerald')}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors',
                    lightingMode === 'emerald'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                  title="ไฟเขียวมรกต ComCoach Theme"
                >
                  เขียว
                </button>
                <button
                  onClick={() => setLightingMode('blue')}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors',
                    lightingMode === 'blue'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                  title="ไฟฟ้านีออน Cyber Blue"
                >
                  ฟ้า
                </button>
                <button
                  onClick={() => setLightingMode('diagnostics')}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors',
                    lightingMode === 'diagnostics'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                  title="ไฟกระพริบเตือนจุดตรวจ"
                >
                  เตือนภัย
                </button>
              </div>

              {/* Wireframe X-Ray */}
              <button
                onClick={() => setViewMode((m) => (m === 'normal' ? 'wireframe' : 'normal'))}
                className={cn(
                  'px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium border backdrop-blur-md transition-all flex items-center gap-1 shadow-lg',
                  viewMode === 'wireframe'
                    ? 'bg-violet-950/80 text-violet-300 border-violet-500/50'
                    : 'bg-slate-900/85 text-slate-400 border-white/10'
                )}
                title="สลับโหมดโครงสร้าง Wireframe X-Ray"
              >
                <Layers size={11} />
                <span className="hidden sm:inline">X-Ray</span>
              </button>
            </div>

            {/* Quick Part Zoom Buttons on bottom-left */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-10 pointer-events-auto py-1">
              <span className="text-[10px] text-slate-400 font-medium px-1 flex-shrink-0">
                🔍 โฟกัสชิ้นส่วน:
              </span>
              {HARDWARE_PARTS.map((part) => {
                const isSelected = part.id === selectedPartId
                const isSuspect = part.stationIds.includes(state.activeStationId)
                return (
                  <button
                    key={part.id}
                    id={`btn-focus-${part.id}`}
                    onClick={() => setSelectedPartId(part.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all border flex items-center gap-1 flex-shrink-0 shadow-md active:scale-95',
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sky-500/25'
                        : isSuspect
                        ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                        : 'bg-slate-900/85 text-slate-400 border-white/10 hover:bg-slate-800'
                    )}
                  >
                    <span>{part.icon}</span>
                    <span>{part.nameTh.split(' ')[0]}</span>
                    {isSuspect && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Interaction Hint */}
            <div className="absolute top-3 right-3 text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-white/10 pointer-events-none hidden md:block shadow-md">
              🖱️ ลากเมาส์เพื่อหมุน 360° | หมุนลูกกลิ้งเพื่อซูม | คลิกที่ตัวอุปกรณ์เพื่อตรวจ
            </div>
          </div>

          {/* ── Right: Diagnostic Details & Evidence Inspector (4-5 Cols) ── */}
          <div className="lg:col-span-5 xl:col-span-4 p-4 sm:p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/95 overflow-y-auto">
            <div className="space-y-4">
              {/* Part Header Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2.5 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 shadow-inner">
                    {selectedPart.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      ชิ้นส่วนฮาร์ดแวร์ประจำการตรวจสอบ
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                      {selectedPart.nameTh}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedPart.nameEn}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {selectedPart.description}
                </p>
              </div>

              {/* Inspection Steps */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 shadow-md">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info size={14} />
                  <span>ขั้นตอนการตรวจสอบเพื่อหาหลักฐานเชิงประจักษ์</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  {selectedPart.checkSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Requirement Rule (Pedagogy) */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs shadow-md">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <AlertTriangle size={14} />
                  <span>หลักฐานเชิงประจักษ์ (Evidence-First Rule):</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed text-[11px]">
                  {selectedPart.evidencePrompt}
                </p>
              </div>

              {/* Safety Reminder */}
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[11px] text-red-300 flex items-start gap-2">
                <span className="font-bold text-red-400 flex-shrink-0">⚠️ กฎความปลอดภัย:</span>
                <span className="leading-relaxed">{selectedPart.safetyWarning}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                id="ask-comcoach-part-btn"
                onClick={handleAskCoach}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 focus-ring"
              >
                <MessageSquare size={16} />
                <span>ถาม ComCoach เกี่ยวกับชิ้นส่วนนี้</span>
              </button>

              <p className="text-[10px] text-slate-500 text-center">
                ระบบจะส่งข้อความสืบค้นไปยัง AI ComCoach และสลับกลับสู่ห้องสนทนาทันที
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
