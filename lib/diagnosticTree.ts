// lib/diagnosticTree.ts
// Station-specific diagnostic knowledge base
// Used by the AI system prompt to provide deep, accurate troubleshooting guidance

export interface HardwareSpec {
  component: string
  spec: string
  note?: string
}

export interface DiagnosticStep {
  step: number
  action: string
  expected: string
  toolNeeded?: string
}

export interface CommonError {
  symptom: string
  likelyCause: string[]
  firstCheck: string
}

export interface StationKnowledge {
  stationId: string
  situation: string
  targetCompetency: string
  equipment: string[]
  teacherSequence: string[]
  hardwareSpecs: HardwareSpec[]
  commonErrors: CommonError[]
  diagnosticSteps: DiagnosticStep[]
  safetyWarnings: string[]
  quickChecklist: string[]
}

export const DIAGNOSTIC_KNOWLEDGE: StationKnowledge[] = [
  {
    stationId: 'station-1',
    situation: 'กดปุ่ม Power แล้วไม่มีไฟ Power ไม่มีเสียง และพัดลมไม่หมุน',
    targetCompetency: 'การระบุปัญหาและจัดลำดับการตรวจสอบ',
    equipment: ['เครื่องหรือชุดจำลอง', 'สายไฟ', 'ปลั๊ก/รางไฟ', 'Power Supply', 'Power Switch'],
    teacherSequence: ['ตรวจระบบไฟและสายไฟ', 'Power Supply', 'Power Switch', 'Mainboard'],
    hardwareSpecs: [
      { component: 'PSU', spec: 'Generic 500W ATX', note: 'สวิตช์ ON/OFF ด้านหลัง PSU มักถูกปิดโดยไม่ตั้งใจ' },
      { component: 'Mainboard', spec: 'Intel H61 LGA1155', note: 'LED สถานะ Mainboard ถ้าดับ = ไฟไม่เข้า MB' },
      { component: 'RAM', spec: 'DDR3 4GB x2 (8GB Total)', note: 'Slot 1 ซ้าย, Slot 2 ขวา' },
      { component: 'CPU', spec: 'Intel Core i3-3220', note: 'พัดลม CPU ควรหมุนทันทีเมื่อเปิดเครื่อง' },
      { component: 'Power Cable', spec: '24-pin ATX + 4-pin CPU Power', note: 'ตรวจ connector ทั้งสองจุดให้แน่น' },
    ],
    commonErrors: [
      {
        symptom: 'ไม่มีสัญญาณอะไรเลย — ไฟ LED ไม่ติด พัดลมไม่หมุน',
        likelyCause: ['สายไฟที่ผนังหลวม', 'PSU switch ปิด', 'สาย Power Switch connector หลุด', 'PSU เสีย'],
        firstCheck: 'ตรวจสายไฟที่ผนัง → ตรวจปุ่มสวิตช์ PSU ด้านหลังเคส'
      },
      {
        symptom: 'ไฟบน Mainboard ติด แต่กดปุ่มเปิดไม่มีผล',
        likelyCause: ['Front Panel Power Switch connector ต่อผิด', 'ปุ่ม Power บนเคสเสีย'],
        firstCheck: 'ตรวจ F_PANEL connector บน Mainboard — หาขา PWR_SW'
      },
      {
        symptom: 'PSU ส่งเสียงดัง/ควัน',
        likelyCause: ['PSU ชำรุด'],
        firstCheck: 'ปิดทันที ห้าม short test PSU ด้วยตนเอง — แจ้งครู'
      }
    ],
    diagnosticSteps: [
      { step: 1, action: 'ตรวจสายไฟที่ผนัง (Wall outlet)', expected: 'ปลั๊กแน่น, ไฟมี', toolNeeded: 'ตามองด้วยตา' },
      { step: 2, action: 'ตรวจสวิตช์ ON/OFF ด้านหลัง PSU', expected: 'อยู่ในตำแหน่ง I (ON)', toolNeeded: 'ไม่ต้องใช้เครื่องมือ' },
      { step: 3, action: 'ตรวจสาย 24-pin ATX ที่ Mainboard', expected: 'เสียบแน่น clip ล็อก', toolNeeded: 'มือ' },
      { step: 4, action: 'ตรวจสาย 4-pin CPU Power ใกล้ CPU', expected: 'เสียบแน่น', toolNeeded: 'มือ' },
      { step: 5, action: 'ตรวจ F_PANEL / Front Panel Connector', expected: 'PWR_SW ต่อถูกขา', toolNeeded: 'Manual Mainboard' },
    ],
    safetyWarnings: [
      'ปิดสวิตช์ PSU ก่อนสัมผัสอุปกรณ์ภายใน',
      'ห้าม Short test PSU ด้วยลวดโลหะ',
      'สวมสายรัดข้อมือ Anti-static ก่อนสัมผัส Mainboard',
    ],
    quickChecklist: [
      '☐ สายไฟที่ผนังแน่นดีหรือไม่?',
      '☐ สวิตช์ PSU ด้านหลังเปิดอยู่ (I)?',
      '☐ ไฟ LED บน Mainboard ติดไหม?',
      '☐ สาย 24-pin ATX แน่นหรือไม่?',
      '☐ สาย 4-pin CPU Power แน่นหรือไม่?',
      '☐ F_PANEL PWR_SW ต่อถูกหรือไม่?',
    ]
  },
  {
    stationId: 'station-2',
    situation: 'กด Power แล้วพัดลมหมุน ไฟติด แต่จอภาพไม่แสดงผล',
    targetCompetency: 'การใช้หลักฐานและการตัดสินใจ',
    equipment: ['เครื่องคอมพิวเตอร์', 'RAM', 'GPU/VGA', 'จอภาพ', 'สายสัญญาณ'],
    teacherSequence: ['ตรวจจอและสายสัญญาณ', 'RAM', 'GPU/VGA', 'Mainboard'],
    hardwareSpecs: [
      { component: 'Monitor', spec: 'LG 22" Full HD VGA/HDMI', note: 'ตรวจ Input Source ที่ Monitor ด้วย' },
      { component: 'GPU', spec: 'Integrated Intel HD Graphics 2500', note: 'ไม่มี Dedicated GPU — ใช้ขา VGA/HDMI บน Mainboard' },
      { component: 'RAM', spec: 'DDR3 4GB x1 (Single Channel)', note: 'ถ้า RAM หลวม — POST ไม่ผ่าน จอมืด มีเสียง Beep' },
      { component: 'Display Cable', spec: 'VGA D-Sub 15-pin', note: 'สกรูยึดสาย VGA มักหลวม' },
      { component: 'BIOS Battery', spec: 'CR2032 3V', note: 'ถ้าแบตหมด BIOS settings ล้าง อาจ POST ช้า' },
    ],
    commonErrors: [
      {
        symptom: 'เครื่องเปิดติด พัดลมหมุน แต่จอมืด',
        likelyCause: ['สาย VGA/HDMI หลวม', 'Monitor ปิดอยู่', 'Input Source ผิด', 'RAM หลวม', 'RAM เสีย'],
        firstCheck: 'ตรวจสาย VGA/HDMI ที่จอและที่เคส → ตรวจ Input Source ที่จอ'
      },
      {
        symptom: 'มีเสียง Beep สั้น 1 ครั้ง แล้วจอมืด',
        likelyCause: ['POST สำเร็จแต่ OS มีปัญหา', 'สัญญาณ Display ไม่ถึงจอ'],
        firstCheck: 'ตรวจสาย VGA/HDMI และ Input Source ที่จอ'
      },
      {
        symptom: 'มีเสียง Beep ยาว/สั้นซ้ำๆ',
        likelyCause: ['RAM ผิดปกติ — ถอดแล้วใส่ใหม่', 'RAM เสีย'],
        firstCheck: 'ถอด RAM ออก เช็ดขา gold contact ด้วยยางลบ แล้วใส่ใหม่'
      }
    ],
    diagnosticSteps: [
      { step: 1, action: 'ตรวจสายไฟจอภาพและปุ่มเปิดจอ', expected: 'ไฟ Power LED จอติด', toolNeeded: 'ตา' },
      { step: 2, action: 'ตรวจ Input Source บน Monitor (กดปุ่ม Input/Source)', expected: 'ตรง port ที่เสียบ', toolNeeded: 'ปุ่มที่จอ' },
      { step: 3, action: 'ตรวจสาย VGA/HDMI ทั้ง 2 ปลาย', expected: 'แน่น สกรูยึดแล้ว', toolNeeded: 'ไขควง' },
      { step: 4, action: 'ถอด RAM ออก เช็ดด้วยยางลบ ใส่คืนจนได้ยินเสียง Click', expected: 'เสียงกดติด 2 ข้าง', toolNeeded: 'มือ (ห้ามจับขาทอง)' },
      { step: 5, action: 'ทดสอบเปิดเครื่อง ฟังเสียง POST Beep', expected: '1 beep สั้น = POST สำเร็จ', toolNeeded: 'หู' },
    ],
    safetyWarnings: [
      'ปิดเครื่องก่อนถอด/ใส่ RAM',
      'ห้ามจับขา Gold Contact ของ RAM',
      'อย่าบิดหรืองอสาย VGA แรงเกินไป',
    ],
    quickChecklist: [
      '☐ จอภาพเปิดอยู่ (Power LED ติด)?',
      '☐ Input Source บนจอตรงกับ port ที่เสียบ?',
      '☐ สาย VGA/HDMI แน่นทั้งสองปลาย?',
      '☐ RAM เสียบแน่น (ได้ยินเสียงกด click)?',
      '☐ มีเสียง Beep หรือไม่ (กี่ครั้ง)?',
    ]
  },
  {
    stationId: 'station-3',
    situation: 'ใช้งานไประยะหนึ่งแล้วเครื่องดับหรือ Restart โดยไม่ตั้งใจ',
    targetCompetency: 'การตั้งสมมติฐานและทดสอบสาเหตุ',
    equipment: ['เครื่อง/ชุดจำลอง', 'CPU Fan', 'Power Supply', 'ข้อมูลอุณหภูมิ', 'RAM'],
    teacherSequence: ['ตรวจอุณหภูมิและพัดลม', 'Power Supply', 'RAM', 'ซอฟต์แวร์/ระบบ'],
    hardwareSpecs: [
      { component: 'CPU Cooler', spec: 'Intel Stock Cooler', note: 'ครีมระบายความร้อนเดิม อาจแห้งแล้ว ตรวจ thermal paste' },
      { component: 'CPU Temp', spec: 'ปกติ < 70°C / Load < 85°C', note: 'ใช้ HWMonitor หรือ CPU-Z ดู temp' },
      { component: 'PSU', spec: 'Generic 500W (อาจไม่เสถียร)', note: 'PSU คุณภาพต่ำอาจ restart เมื่อ Load สูง' },
      { component: 'RAM', spec: 'DDR3 4GB x2', note: 'ใช้ memtest86 ตรวจ RAM error' },
      { component: 'OS', spec: 'Windows 10 LTSC', note: 'ตรวจ Windows Update / Driver ที่ค้างไว้' },
    ],
    commonErrors: [
      {
        symptom: 'ดับเองทันทีไม่มีเตือน',
        likelyCause: ['CPU ร้อนเกิน (Thermal Shutdown)', 'PSU ไม่เสถียร (Power Failure)'],
        firstCheck: 'ตรวจอุณหภูมิ CPU ด้วย HWMonitor → ตรวจพัดลม CPU หมุนปกติไหม'
      },
      {
        symptom: 'Restart เองซ้ำๆ ขณะใช้งาน',
        likelyCause: ['RAM error', 'Driver เสีย', 'Windows update ค้าง', 'Malware'],
        firstCheck: 'ดู Event Viewer → Windows Logs → System เพื่อหา error ก่อน restart'
      },
      {
        symptom: 'Blue Screen of Death (BSOD)',
        likelyCause: ['Driver ไม่เข้ากัน', 'RAM เสีย', 'Storage เสีย'],
        firstCheck: 'จด Stop Code บน BSOD แล้วค้นหาความหมาย'
      }
    ],
    diagnosticSteps: [
      { step: 1, action: 'เปิด HWMonitor / Core Temp ดูอุณหภูมิ CPU', expected: 'ขณะ idle < 60°C', toolNeeded: 'HWMonitor (โปรแกรม)' },
      { step: 2, action: 'ตรวจพัดลม CPU หมุนหรือไม่ (มองผ่านช่องระบาย)', expected: 'หมุนต่อเนื่อง ไม่กระตุก', toolNeeded: 'ตา / Flashlight' },
      { step: 3, action: 'เปิด Task Manager ดู CPU/RAM/Disk ขณะใช้งาน', expected: 'ไม่มีค่าใดที่ 100% ตลอด', toolNeeded: 'Ctrl+Shift+Esc' },
      { step: 4, action: 'ดู Event Viewer → Windows Logs → System', expected: 'หา Critical Error ก่อนเวลา Restart', toolNeeded: 'Windows Event Viewer' },
      { step: 5, action: 'รัน memtest86 ทิ้งไว้ 1 รอบ', expected: '0 Errors', toolNeeded: 'USB Boot memtest86' },
    ],
    safetyWarnings: [
      'อย่าสัมผัส Heatsink ขณะเครื่องทำงาน — อาจร้อนมาก',
      'ปิดเครื่องก่อนทำความสะอาดพัดลมด้วยสเปรย์ลม',
      'บันทึก BSOD Stop Code ก่อนเครื่อง restart',
    ],
    quickChecklist: [
      '☐ CPU Temp ขณะ Idle เท่าไหร่?',
      '☐ พัดลม CPU หมุนปกติหรือไม่?',
      '☐ Task Manager มี process ใดที่ CPU/RAM 100%?',
      '☐ Event Viewer มี Error อะไรบ้าง?',
      '☐ มี BSOD หรือไม่ — Stop Code คืออะไร?',
    ]
  },
  {
    stationId: 'station-4',
    situation: 'เปิดเครื่องนาน โปรแกรมตอบสนองช้า และมีอาการหน่วง',
    targetCompetency: 'การวิเคราะห์ข้อมูลและเลือกแนวทางแก้ไข',
    equipment: ['เครื่อง/ภาพ Task Manager', 'RAM', 'HDD/SSD', 'ข้อมูล CPU/RAM/Disk/Startup'],
    teacherSequence: ['ตรวจ Task Manager', 'CPU/RAM/Disk', 'Startup/พื้นที่จัดเก็บ', 'Malware/Storage'],
    hardwareSpecs: [
      { component: 'Storage', spec: 'HDD 500GB SATA (เก่า 5+ ปี)', note: 'ใช้ CrystalDiskInfo ตรวจ Health Status' },
      { component: 'RAM', spec: 'DDR3 4GB (เหลือน้อย — Pagefile ทำงานหนัก)', note: 'ถ้า RAM ไม่พอ → Disk 100% จาก Pagefile' },
      { component: 'OS', spec: 'Windows 10 (มีโปรแกรม Startup เยอะ)', note: 'Disable Startup programs ไม่จำเป็น' },
      { component: 'Antivirus', spec: 'Windows Defender (อาจ Scan Background)', note: 'Defender Full Scan ทำ Disk 100%' },
      { component: 'Browser', spec: 'Chrome (หลาย Extension)', note: 'Chrome กิน RAM มาก — ตรวจ Chrome Task Manager' },
    ],
    commonErrors: [
      {
        symptom: 'Disk 100% ใน Task Manager ตลอดเวลา',
        likelyCause: ['HDD เสื่อม (bad sectors)', 'Superfetch/SysMain ทำงาน', 'Windows Update background', 'Malware', 'RAM ไม่พอ → Pagefile ทำงาน'],
        firstCheck: 'Task Manager → Details tab → Sort by Disk → ดูว่า process ใดกิน Disk มากสุด'
      },
      {
        symptom: 'เปิดโปรแกรมช้ามาก Boot นาน',
        likelyCause: ['Startup programs เยอะ', 'HDD เสื่อม', 'RAM ไม่พอ'],
        firstCheck: 'Task Manager → Startup tab → Disable ที่ไม่จำเป็น'
      },
      {
        symptom: 'CPU 100% ตลอดเวลาโดยไม่ได้เปิดโปรแกรม',
        likelyCause: ['Malware', 'Windows Update', 'Antivirus Scan'],
        firstCheck: 'Task Manager → CPU sort → หา process ผิดปกติ'
      }
    ],
    diagnosticSteps: [
      { step: 1, action: 'เปิด Task Manager (Ctrl+Shift+Esc) ดู CPU/RAM/Disk/Network', expected: 'ระบุ resource ใดที่ถึง 100%', toolNeeded: 'Task Manager' },
      { step: 2, action: 'Task Manager → Startup tab → Disable โปรแกรมที่ไม่จำเป็น', expected: 'ลด startup time', toolNeeded: 'Task Manager' },
      { step: 3, action: 'ดาวน์โหลดและรัน CrystalDiskInfo', expected: 'Caution/Bad = HDD มีปัญหา, Good = ปกติ', toolNeeded: 'CrystalDiskInfo' },
      { step: 4, action: 'ตรวจพื้นที่ C: drive', expected: 'ควรมีพื้นที่ว่างอย่างน้อย 10GB', toolNeeded: 'File Explorer' },
      { step: 5, action: 'รัน Windows Security → Quick Scan', expected: 'ไม่พบ Threat', toolNeeded: 'Windows Defender' },
    ],
    safetyWarnings: [
      'อย่า Delete ไฟล์ system32 หรือ Windows folder',
      'Backup ข้อมูลสำคัญก่อน Defrag HDD',
      'อย่า End Task Windows System Processes ใน Task Manager',
    ],
    quickChecklist: [
      '☐ Task Manager — CPU/RAM/Disk แต่ละตัวเท่าไหร่ %?',
      '☐ Process ใดกิน resource มากที่สุด?',
      '☐ Startup programs มีกี่ตัว?',
      '☐ CrystalDiskInfo บอกอะไร (Good/Caution/Bad)?',
      '☐ พื้นที่ C: drive เหลือเท่าไหร่?',
    ]
  }
]

/**
 * Get the diagnostic knowledge for a given station
 */
export function getStationKnowledge(stationId: string): StationKnowledge | undefined {
  return DIAGNOSTIC_KNOWLEDGE.find((k) => k.stationId === stationId)
}

/**
 * Format station knowledge into a system prompt string
 */
export function formatKnowledgeForPrompt(stationId: string): string {
  const k = getStationKnowledge(stationId)
  if (!k) return ''

  const hw = k.hardwareSpecs.map((h) => `  • ${h.component}: ${h.spec}${h.note ? ` (${h.note})` : ''}`).join('\n')
  const errors = k.commonErrors.map((e, i) =>
    `  ${i + 1}. อาการ: "${e.symptom}"\n     สาเหตุที่เป็นไปได้: ${e.likelyCause.join(', ')}\n     ตรวจก่อน: ${e.firstCheck}`
  ).join('\n')
  const checklist = k.quickChecklist.join('\n  ')
  const teacherSeq = k.teacherSequence.join(' ➔ ')
  const eqList = k.equipment.join(', ')

  return `
[ข้อมูลตามเอกสารกิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์]
- สถานการณ์ประจำฐาน: "${k.situation}"
- สมรรถนะที่เน้น: ${k.targetCompetency}
- อุปกรณ์/หลักฐาน: ${eqList}
- แนวลำดับตรวจสอบสำหรับครู (Teacher Diagnostic Sequence): ${teacherSeq}

Hardware ในห้อง Lab สำหรับ Station นี้:
${hw}

อาการที่พบบ่อยและการวินิจฉัย:
${errors}

Quick Checklist สำหรับนักเรียน:
  ${checklist}
`
}
