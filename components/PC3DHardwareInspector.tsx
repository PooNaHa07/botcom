// components/PC3DHardwareInspector.tsx
// Interactive 3D Computer Hardware Inspector & Fault Navigator using Three.js

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

const HARDWARE_PARTS: HardwarePart[] = [
  {
    id: 'psu',
    nameTh: 'Power Supply (PSU) & สวิตช์ไฟ',
    nameEn: 'Power Supply Unit & AC Switch',
    icon: '🔌',
    stationIds: ['station-1', 'station-3'],
    color: 0xef4444, // Red
    position: [-1.4, -1.3, -0.6],
    size: [1.6, 1.2, 1.4],
    cameraTarget: [-1.4, -1.3, -0.6],
    cameraPos: [-3.2, -0.8, 1.5],
    description:
      'แปลงไฟบ้าน AC เป็นไฟ DC เลี้ยงอุปกรณ์ทั้งหมด หากเสียหรือสวิตช์ปิดอยู่ เครื่องจะไม่ติดเลย ไม่มีไฟและพัดลม',
    checkSteps: [
      'ตรวจสวิตช์ I/O ด้านหลัง PSU ว่าเปิดอยู่ที่ตำแหน่ง ( | ) หรือไม่',
      'ตรวจสายไฟ AC 3 รู เสียบแน่นกับเต้าเสียบผนังและหลังเคส',
      'ตรวจพัดลมหลัง PSU ว่าหมุนหรือมีกลิ่นไหม้ผิดปกติหรือไม่',
    ],
    evidencePrompt: 'ต้องมีผลทดสอบสายไฟ หรือวัดไฟจากพาวเวอร์ซัพพลายก่อนเปลี่ยน',
    safetyWarning: 'ถอดปลั๊กทุกครั้งก่อนถอดเปลี่ยน ห้ามเปิดฝาครอบ PSU เพราะมีประจุแรงดันสูงค้างอยู่',
    quickQuestion: 'ComCoach ครับ ผมตรวจสอบสวิตช์หลัง PSU และสาย AC แล้ว เสียบแน่นปกติ ควรตรวจสาย 24-pin ต่อไหมครับ?',
  },
  {
    id: 'front-panel',
    nameTh: 'สายสวิตช์เปิดเครื่อง (Power SW Header)',
    nameEn: 'Front Panel Power Switch Header',
    icon: '🔘',
    stationIds: ['station-1'],
    color: 0xf59e0b, // Amber
    position: [1.2, -1.8, 0.4],
    size: [0.6, 0.4, 0.4],
    cameraTarget: [1.2, -1.8, 0.4],
    cameraPos: [1.5, -0.8, 2.0],
    description:
      'ขั้วจัมเปอร์ที่ต่อจากปุ่มเปิดหน้าเคสลงสู่เมนบอร์ด หากสายหลุด หลวม หรือปุ่มกดหน้าเคสค้าง เครื่องจะไม่ตอบสนอง',
    checkSteps: [
      'ตรวจขั้วต่อ Power SW ที่มุมล่างขวาของเมนบอร์ดว่าเสียบตรงพินคู่ Power Switch หรือไม่',
      'ตรวจสายไฟเส้นเล็กว่าขาดในหรือหลุดจากขั้วหรือไม่',
      'ทดสอบสัมผัสพินเปิดเครื่องด้วยเครื่องมือเฉพาะ (โดยมีครูผู้สอนดูแล)',
    ],
    evidencePrompt: 'บันทึกรูปถ่ายตำแหน่งพิน Power SW บนบอร์ดเปรียบเทียบกับคู่มือเมนบอร์ด',
    safetyWarning: 'ห้ามใช้โลหะช็อตพินอื่นๆ โดยไม่มั่นใจ เพราะอาจทำให้เมนบอร์ดช็อตเสียหายได้',
    quickQuestion: 'ComCoach ครับ สาย Power SW หน้าเคสดูเหมือนเสียบไม่แน่น มีวิธีตรวจสอบอย่างไรให้ปลอดภัยครับ?',
  },
  {
    id: 'ram',
    nameTh: 'RAM (แรม) & ขั้วสัมผัสทองแดง',
    nameEn: 'RAM Modules & DIMM Slots',
    icon: '💾',
    stationIds: ['station-2', 'station-3', 'station-4'],
    color: 0x3b82f6, // Blue
    position: [0.6, 0.4, 0.1],
    size: [0.4, 1.4, 0.15],
    cameraTarget: [0.6, 0.4, 0.1],
    cameraPos: [1.2, 0.8, 1.8],
    description:
      'หน่วยความจำชั่วคราว หากหน้าสัมผัสสกปรก ขั้วทองแดงเป็นคราบออกไซด์ หรือหลวม เครื่องจะติดมีไฟ พัดลมหมุน แต่จอดำสนิท',
    checkSteps: [
      'สังเกตสลักล็อกหัว-ท้ายของสล็อตแรมว่าดีดเข้าที่แน่นหนาทั้งสองฝั่งหรือไม่',
      'ถอดปลั๊กเครื่อง แล้วปลดแรมออกมาตรวจดูคราบคาร์บอน/ฝุ่นที่ขอบทองแดง',
      'ลองสลับใส่ทีละ 1 แถวเพื่อทดสอบว่าแถวใดเสีย',
    ],
    evidencePrompt: 'ต้องตรวจสอบเสียงสัญญาณเตือน (Beep Code) หรือไฟ Debug LED บนบอร์ดก่อนสรุปว่าแรมเสีย',
    safetyWarning: 'ห้ามใช้มือเปล่าสัมผัสขั้วทองแดงเด็ดขาด เพราะไขมันและความชื้นจะทำให้เกิดคราบออกไซด์',
    quickQuestion: 'ComCoach ครับ แรมถอดออกมาแล้ว สังเกตเห็นคราบที่ขั้วทองแดง ควรใช้ยางลบดินสอทำความสะอาดอย่างไรครับ?',
  },
  {
    id: 'gpu',
    nameTh: 'การ์ดจอแยก (GPU / PCIe Card)',
    nameEn: 'Dedicated Graphics Card (GPU)',
    icon: '🖥️',
    stationIds: ['station-2'],
    color: 0x8b5cf6, // Purple
    position: [0.1, -0.6, 0.5],
    size: [2.2, 0.6, 1.1],
    cameraTarget: [0.1, -0.6, 0.5],
    cameraPos: [0.2, 0.2, 2.8],
    description:
      'ประมวลผลกราฟิก หากเสียบสายจอผิดช่อง (เสียบที่บอร์ดแทนการ์ดจอ) หรือการ์ดจอหลวม จอจะไม่ติดแม้เครื่องทำงาน',
    checkSteps: [
      'ตรวจสาย HDMI / DisplayPort ว่าเสียบที่หลังการ์ดจอ (ช่องล่าง) ไม่ใช่ช่องที่เมนบอร์ด (ช่องบน)',
      'ตรวจสายไฟเลี้ยงเสริม PCIe 6-pin / 8-pin ว่าเสียบแน่นหนา',
      'ตรวจการ์ดจอว่าเสียบลงล็อกช่อง PCIe x16 สุดสนิทหรือไม่',
    ],
    evidencePrompt: 'ถ่ายภาพพอร์ตหลังเครื่องเพื่อพิสูจน์ว่าเสียบสายจอตรงกับการ์ดจอที่กำลังทำงาน',
    safetyWarning: 'ปิดเครื่องและปลดสายไฟก่อนเสมอ การ์ดจออาจมีความร้อนสะสมสูงหลังจากเปิดใช้งาน',
    quickQuestion: 'ComCoach ครับ ผมสังเกตว่ามีพอร์ตจอทั้งที่เมนบอร์ดและการ์ดจอ ผมควรเสียบสายที่ช่องไหนครับ?',
  },
  {
    id: 'cpu-cooler',
    nameTh: 'พัดลมและซิลิโคนระบายความร้อน CPU',
    nameEn: 'CPU Cooler, Heatsink & Thermal Paste',
    icon: '❄️',
    stationIds: ['station-3', 'station-4'],
    color: 0x10b981, // Emerald
    position: [-0.3, 0.4, 0.3],
    size: [1.1, 1.1, 0.8],
    cameraTarget: [-0.3, 0.4, 0.3],
    cameraPos: [-0.2, 1.0, 2.2],
    description:
      'ระบายความร้อนให้ CPU หากพัดลมไม่หมุน ครีบอลูมิเนียมฝุ่นเกาะ หรือซิลิโคนแห้ง เครื่องจะ Overheat แล้วดับเองเพื่อป้องกัน CPU เสียหาย',
    checkSteps: [
      'สังเกตตอนเปิดเครื่องว่าพัดลม CPU หมุนคล่องและสม่ำเสมอหรือไม่',
      'ตรวจดูฝุ่นอุดตันตามช่องครีบของฮีทซิงค์',
      'เข้า BIOS หรือใช้โปรแกรมตรวจสอบอุณหภูมิ CPU (ปกติไม่ควรเกิน 75-80°C)',
    ],
    evidencePrompt: 'จดบันทึกค่าอุณหภูมิ CPU Temp จากหน้าจอ BIOS เป็นหลักฐานก่อนรื้อฮีทซิงค์',
    safetyWarning: 'ห้ามรื้อฮีทซิงค์ออกขณะเครื่องยังร้อน และระวังขาล็อกพัดลมหักเด็ดขาด',
    quickQuestion: 'ComCoach ครับ เครื่องเปิดได้สักพักแล้วดับเอง พัดลม CPU หมุนช้ามาก มีวิธีตรวจเช็คอุณหภูมิอย่างไรครับ?',
  },
  {
    id: 'storage',
    nameTh: 'ฮาร์ดดิสก์ / SSD (M.2 NVMe & SATA)',
    nameEn: 'Storage (SSD / HDD)',
    icon: '💽',
    stationIds: ['station-4'],
    color: 0x06b6d4, // Cyan
    position: [1.5, -0.6, -0.2],
    size: [0.8, 1.2, 0.4],
    cameraTarget: [1.5, -0.6, -0.2],
    cameraPos: [2.2, -0.2, 1.4],
    description:
      'จัดเก็บระบบปฏิบัติการและข้อมูล หากพื้นที่เต็ม หรือเป็นไดรฟ์ HDD เก่าที่มี Bad Sector จะทำให้เครื่องหน่วงค้าง Disk 100%',
    checkSteps: [
      'เปิด Task Manager ตรวจดูแท็บ Performance ค่าดิสก์ว่าขึ้น 100% ค้างตลอดเวลาหรือไม่',
      'ตรวจพื้นที่ว่างของไดรฟ์ C: ว่าเหลือน้อยกว่า 10-15% หรือไม่',
      'ตรวจสุขภาพของไดรฟ์ด้วยโปรแกรม CrystalDiskInfo',
    ],
    evidencePrompt: 'แคปเจอร์ภาพ Task Manager แท็บ Performance Disk 100% แนบให้ ComCoach ตรวจสอบ',
    safetyWarning: 'อย่าเคาะ ขยับ หรือกระทบกระเทือนเคสขณะเครื่องทำงาน โดยเฉพาะอย่างยิ่งหากเป็น HDD จานหมุน',
    quickQuestion: 'ComCoach ครับ เปิด Task Manager แล้วเห็นช่อง Disk ขึ้น 100% ตลอดเวลาเลย เกิดจากอะไรได้บ้างครับ?',
  },
]

export default function PC3DHardwareInspector() {
  const { state, toggle3DModel, setStation, addMessage } = useChat()
  const activeStation = STATIONS.find((s) => s.id === state.activeStationId)!

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedPartId, setSelectedPartId] = useState<string>(() => {
    // Default to first suspect part for the current station
    const suspect = HARDWARE_PARTS.find((p) => p.stationIds.includes(state.activeStationId))
    return suspect ? suspect.id : HARDWARE_PARTS[0].id
  })
  const [isRotating, setIsRotating] = useState(true)
  const [viewMode, setViewMode] = useState<'normal' | 'wireframe'>('normal')

  const selectedPart = HARDWARE_PARTS.find((p) => p.id === selectedPartId) || HARDWARE_PARTS[0]

  // Update selected part when station changes
  useEffect(() => {
    const suspect = HARDWARE_PARTS.find((p) => p.stationIds.includes(state.activeStationId))
    if (suspect) setSelectedPartId(suspect.id)
  }, [state.activeStationId])

  // Camera animation target refs
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5))
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const sceneRef = useRef<THREE.Scene | null>(null)
  const meshGroupRef = useRef<THREE.Group | null>(null)
  const cpuFanRef = useRef<THREE.Mesh | null>(null)
  const partsMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())

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

  // Reset to overview camera
  const resetCameraOverview = () => {
    targetCamPos.current.set(0, 0.4, 5.2)
    targetLookAt.current.set(0, 0, 0)
  }

  // ─── Three.js Scene Setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (!state.model3DOpen || !canvasRef.current) return

    const canvas = canvasRef.current
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    // Scene & Camera
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x030712) // Slate 950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 5.2)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.2)
    mainLight.position.set(5, 6, 6)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x10b981, 1.4)
    fillLight.position.set(-5, -3, -4)
    scene.add(fillLight)

    const topLight = new THREE.PointLight(0xffffff, 1.5, 10)
    topLight.position.set(0, 4, 2)
    scene.add(topLight)

    // Master Group for the whole PC Model
    const pcGroup = new THREE.Group()
    meshGroupRef.current = pcGroup
    scene.add(pcGroup)

    // ── 1. PC Case Structure ───────────────────────────────────────────────
    // Back & Floor & Top & Front panels (Black metal)
    const caseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.8,
    })

    // Back wall
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.4, 0.1), caseMaterial)
    backPanel.position.set(0, 0, -1.2)
    pcGroup.add(backPanel)

    // Bottom floor
    const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 2.4), caseMaterial)
    bottomPanel.position.set(0, -2.2, 0)
    pcGroup.add(bottomPanel)

    // Top ceiling
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 2.4), caseMaterial)
    topPanel.position.set(0, 2.2, 0)
    pcGroup.add(topPanel)

    // Front bezel
    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.4, 2.4), caseMaterial)
    frontPanel.position.set(2.1, 0, 0)
    pcGroup.add(frontPanel)

    // Back frame
    const rearFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.4, 2.4), caseMaterial)
    rearFrame.position.set(-2.1, 0, 0)
    pcGroup.add(rearFrame)

    // ── 2. Motherboard (PCB) ───────────────────────────────────────────────
    const moboMaterial = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Dark forest green / slate green
      roughness: 0.3,
      metalness: 0.4,
    })
    const mobo = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.08), moboMaterial)
    mobo.position.set(0, 0, -1.1)
    pcGroup.add(mobo)

    // PCIe slots
    const pcieMat = new THREE.MeshStandardMaterial({ color: 0x1e293b })
    for (let i = 0; i < 3; i++) {
      const pcie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.12), pcieMat)
      pcie.position.set(0, -0.3 - i * 0.4, -1.0)
      pcGroup.add(pcie)
    }

    // ── 3. Parts Meshes (Interactive & Highlightable) ──────────────────────
    const partsMap = new Map<string, THREE.Mesh>()

    HARDWARE_PARTS.forEach((part) => {
      const isSuspect = part.stationIds.includes(state.activeStationId)

      const mat = new THREE.MeshStandardMaterial({
        color: isSuspect ? part.color : 0x475569,
        roughness: 0.4,
        metalness: 0.6,
        wireframe: viewMode === 'wireframe',
        emissive: isSuspect ? part.color : 0x000000,
        emissiveIntensity: isSuspect ? 0.35 : 0.0,
      })

      const geom = new THREE.BoxGeometry(...part.size)
      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.set(...part.position)
      mesh.name = part.id
      pcGroup.add(mesh)
      partsMap.set(part.id, mesh)

      // Add extra details for specific parts
      if (part.id === 'cpu-cooler') {
        // CPU Heatsink fan blades
        const fanGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12)
        const fanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 })
        const fanMesh = new THREE.Mesh(fanGeom, fanMat)
        fanMesh.rotation.x = Math.PI / 2
        fanMesh.position.set(0, 0, 0.45)
        mesh.add(fanMesh)
        cpuFanRef.current = fanMesh
      }

      if (part.id === 'ram') {
        // Dual RAM stick effect
        const ram2 = new THREE.Mesh(
          new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]),
          mat
        )
        ram2.position.set(0.2, 0, 0)
        mesh.add(ram2)
      }
    })
    partsMeshesRef.current = partsMap

    // ── Mouse Drag & Orbit Controls ────────────────────────────────────────
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
        // Tap on touch device -> raycast
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

    // ── Animation Loop ─────────────────────────────────────────────────────
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      // Rotate CPU fan
      if (cpuFanRef.current) {
        cpuFanRef.current.rotation.z += 0.08
      }

      // Slow idle rotation if user enabled it and not dragging
      if (isRotating && !isDragging && !isTouchDragging && pcGroup) {
        pcGroup.rotation.y += 0.002
      }

      // Smooth camera interpolation (lerp)
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.06)
        currentLookAt.current.lerp(targetLookAt.current, 0.06)
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
  }, [state.model3DOpen, isRotating, viewMode, state.activeStationId])

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
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Box size={16} className="animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-bold text-white truncate">
                  โมเดล 3D จำลองเคสคอมพิวเตอร์
                </h2>
                <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-500/30">
                  Interactive 3D
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                ใช้นิ้วหมุน / ซูม หรือแตะชิ้นส่วนเพื่อตรวจสอบ
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-5 py-1.5 sm:py-2 bg-slate-950/70 border-b border-white/5 text-xs gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] sm:text-xs">สถานี:</span>
            <span className={cn('font-bold flex items-center gap-1 text-[11px] sm:text-xs', activeStation.color)}>
              <span>{activeStation.icon}</span>
              <span>Station {activeStation.number}: {activeStation.titleTh}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[10px] sm:text-[11px]">
            <Sparkles size={11} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">ชิ้นส่วนเรืองแสง คือจุดสงสัยของสถานีนี้</span>
          </div>
        </div>

        {/* ── Main 3D Canvas + Diagnosis Split ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
          {/* ── Left / Center: Interactive 3D Viewport (7-8 Cols) ── */}
          <div className="lg:col-span-7 xl:col-span-8 relative flex flex-col bg-slate-950 min-h-[260px] sm:min-h-[360px] lg:min-h-[500px]">
            {/* 3D WebGL Canvas */}
            <canvas
              ref={canvasRef}
              id="pc-3d-canvas"
              className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
            />

            {/* 3D Viewport HUD Overlay Controls */}
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 sm:gap-1.5 z-10 pointer-events-auto max-w-[calc(100%-20px)]">
              <button
                onClick={resetCameraOverview}
                className="px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 backdrop-blur-sm transition-colors flex items-center gap-1"
                title="มุมมองรวมทั้งหมด"
              >
                <Eye size={11} />
                <span>รวม</span>
              </button>

              <button
                onClick={() => setIsRotating((v) => !v)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium border backdrop-blur-sm transition-colors flex items-center gap-1',
                  isRotating
                    ? 'bg-sky-950/80 text-sky-400 border-sky-500/40'
                    : 'bg-slate-900/80 text-slate-400 border-white/10'
                )}
                title="หมุนโมเดลอัตโนมัติ"
              >
                <RotateCw size={12} className={isRotating ? 'animate-spin' : ''} />
                <span>{isRotating ? 'หมุนอัตโนมัติ (On)' : 'หมุนอัตโนมัติ (Off)'}</span>
              </button>

              <button
                onClick={() => setViewMode((m) => (m === 'normal' ? 'wireframe' : 'normal'))}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium border backdrop-blur-sm transition-colors flex items-center gap-1',
                  viewMode === 'wireframe'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-900/80 text-slate-400 border-white/10'
                )}
                title="สลับโหมดโครงสร้าง Wireframe"
              >
                <Layers size={12} />
                <span>{viewMode === 'wireframe' ? 'Wireframe X-Ray' : 'Shaded'}</span>
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
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border flex items-center gap-1 flex-shrink-0',
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-lg shadow-sky-500/20'
                        : isSuspect
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/40'
                        : 'bg-slate-900/80 text-slate-400 border-white/10 hover:bg-slate-800'
                    )}
                  >
                    <span>{part.icon}</span>
                    <span>{part.nameTh.split(' ')[0]}</span>
                    {isSuspect && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                )
              })}
            </div>

            {/* 3D Interaction instructions */}
            <div className="absolute top-3 right-3 text-[10px] text-slate-500 bg-slate-950/80 px-2 py-1 rounded border border-white/5 pointer-events-none hidden sm:block">
              🖱️ คลิกซ้ายลากเพื่อหมุน | หมุนล้อเมาส์เพื่อซูม | คลิกที่ชิ้นส่วนเพื่อตรวจสอบ
            </div>
          </div>

          {/* ── Right: Diagnostic Details & Evidence Inspector (4-5 Cols) ── */}
          <div className="lg:col-span-5 xl:col-span-4 p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/90 overflow-y-auto">
            <div className="space-y-4">
              {/* Part Header Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                    {selectedPart.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      ชิ้นส่วนฮาร์ดแวร์
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">
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
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info size={13} />
                  ขั้นตอนการตรวจสอบเพื่อหาหลักฐาน
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  {selectedPart.checkSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Requirement Rule (Pedagogy) */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <AlertTriangle size={13} />
                  <span>หลักฐานเชิงประจักษ์ (Evidence-First Rule):</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed text-[11px]">
                  {selectedPart.evidencePrompt}
                </p>
              </div>

              {/* Safety Reminder */}
              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-[11px] text-red-300">
                <span className="font-bold text-red-400">⚠️ ข้อควรระวัง: </span>
                {selectedPart.safetyWarning}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                id="ask-comcoach-part-btn"
                onClick={handleAskCoach}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 focus-ring"
              >
                <MessageSquare size={15} />
                <span>ถาม ComCoach เกี่ยวกับชิ้นส่วนนี้</span>
              </button>

              <p className="text-[10px] text-slate-500 text-center">
                ระบบจะส่งข้อความถามโค้ชและกลับสู่ห้องสนทนาทันที
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
