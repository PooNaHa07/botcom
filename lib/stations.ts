// lib/stations.ts
// Station metadata for the 4 computer lab troubleshooting stations
// Aligned 100% with "กิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์.pdf"

export interface Station {
  id: string
  number: number
  titleTh: string
  titleEn: string
  icon: string
  situation: string // สถานการณ์ จาก PDF
  equipment: string[] // อุปกรณ์/หลักฐาน จาก PDF
  teacherSequence: string[] // แนวลำดับตรวจสอบสำหรับครู จาก PDF
  targetCompetency: string // สมรรถนะที่เน้น จาก PDF
  objective: string
  hint: string
  color: string
  bgColor: string
  borderColor: string
  coords: { x: number; y: number } // Percentage in lab grid (0-100)
  zone: string
  directions: string
}

export const STATIONS: Station[] = [
  {
    id: 'station-1',
    number: 1,
    titleTh: 'เปิดไม่ติด ไฟไม่มา',
    titleEn: 'No Power / No Fan / No Lights',
    icon: '🔌',
    situation: 'กดปุ่ม Power แล้วไม่มีไฟ Power ไม่มีเสียง และพัดลมไม่หมุน',
    equipment: [
      'เครื่องหรือชุดจำลอง',
      'สายไฟ',
      'ปลั๊ก/รางไฟ',
      'Power Supply',
      'Power Switch',
    ],
    teacherSequence: [
      'ตรวจระบบไฟและสายไฟ',
      'Power Supply',
      'Power Switch',
      'Mainboard',
    ],
    targetCompetency: 'การระบุปัญหาและจัดลำดับการตรวจสอบ',
    objective:
      'ตรวจสอบว่าทำไมเครื่องคอมพิวเตอร์ไม่มีสัญญาณไฟฟ้าเลย ไม่มีไฟ LED ไม่มีเสียงพัดลม โดยใช้การสังเกตและตรวจสอบอย่างเป็นระบบ',
    hint: 'เริ่มจากภายนอก: สายไฟ → ปลั๊ก → สวิตช์ PSU → แล้วค่อยตรวจภายใน',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/40',
    coords: { x: 25, y: 35 },
    zone: 'โต๊ะปฏิบัติการ A1 (โซนหน้าห้อง ฝั่งซ้าย)',
    directions: 'จากประตูทางเข้า เดินตรง 3 ก้าว เลี้ยวซ้ายเข้าแถวแรก โต๊ะเครื่องที่ 1',
  },
  {
    id: 'station-2',
    number: 2,
    titleTh: 'เครื่องติด แต่จอมืด',
    titleEn: 'Power On, Fan Spins, Black Screen',
    icon: '🖥️',
    situation: 'กด Power แล้วพัดลมหมุน ไฟติด แต่จอภาพไม่แสดงผล',
    equipment: [
      'เครื่องคอมพิวเตอร์',
      'RAM',
      'GPU/VGA',
      'จอภาพ',
      'สายสัญญาณ',
    ],
    teacherSequence: [
      'ตรวจจอและสายสัญญาณ',
      'RAM',
      'GPU/VGA',
      'Mainboard',
    ],
    targetCompetency: 'การใช้หลักฐานและการตัดสินใจ',
    objective:
      'เครื่องเปิดติดมีไฟและพัดลมทำงาน แต่หน้าจอไม่แสดงภาพ ให้ระบุสาเหตุและแนวทางแก้ไข',
    hint: 'ตรวจสอบ: จอภาพ → สายสัญญาณ → RAM → การ์ดจอ → เมนบอร์ด',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-500/40',
    coords: { x: 75, y: 35 },
    zone: 'โต๊ะปฏิบัติการ A2 (โซนหน้าห้อง ฝั่งขวา)',
    directions: 'จากประตูทางเข้า เดินตรง 3 ก้าว เบี่ยงขวาไปยังแถวแรก โต๊ะเครื่องที่ 2',
  },
  {
    id: 'station-3',
    number: 3,
    titleTh: 'เครื่องดับหรือ Restart เอง',
    titleEn: 'Random Shutdown / Auto Restart',
    icon: '⚡',
    situation: 'ใช้งานไประยะหนึ่งแล้วเครื่องดับหรือ Restart โดยไม่ตั้งใจ',
    equipment: [
      'เครื่อง/ชุดจำลอง',
      'CPU Fan',
      'Power Supply',
      'ข้อมูลอุณหภูมิ',
      'RAM',
    ],
    teacherSequence: [
      'ตรวจอุณหภูมิและพัดลม',
      'Power Supply',
      'RAM',
      'ซอฟต์แวร์/ระบบ',
    ],
    targetCompetency: 'การตั้งสมมติฐานและทดสอบสาเหตุ',
    objective:
      'เครื่องคอมพิวเตอร์ดับหรือ Restart เองโดยไม่ได้สั่ง ให้วิเคราะห์หาสาเหตุที่เป็นไปได้',
    hint: 'ตรวจสอบ: ความร้อน CPU/พัดลม → PSU → RAM → ซอฟต์แวร์/OS',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/40',
    coords: { x: 25, y: 72 },
    zone: 'โต๊ะปฏิบัติการ B1 (โซนหลังห้อง ฝั่งซ้าย)',
    directions: 'จากประตูทางเข้า เดินตรงไปตามทางเดินกลาง 7 ก้าว เลี้ยวซ้ายเข้าโต๊ะแถวหลัง',
  },
  {
    id: 'station-4',
    number: 4,
    titleTh: 'เครื่องทำงานช้า',
    titleEn: 'System Slow / High Usage / Lag',
    icon: '🐌',
    situation: 'เปิดเครื่องนาน โปรแกรมตอบสนองช้า และมีอาการหน่วง',
    equipment: [
      'เครื่อง/ภาพ Task Manager',
      'RAM',
      'HDD/SSD',
      'ข้อมูล CPU/RAM/Disk/Startup',
    ],
    teacherSequence: [
      'ตรวจ Task Manager',
      'CPU/RAM/Disk',
      'Startup/พื้นที่จัดเก็บ',
      'Malware/Storage',
    ],
    targetCompetency: 'การวิเคราะห์ข้อมูลและเลือกแนวทางแก้ไข',
    objective:
      'เครื่องคอมพิวเตอร์ทำงานช้าผิดปกติ ให้ใช้ Task Manager และเครื่องมือต่างๆ วิเคราะห์และแก้ไข',
    hint: 'ตรวจ: Task Manager (CPU/RAM/Disk%) → โปรแกรม Startup → พื้นที่ฮาร์ดดิสก์ → Malware',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/40',
    coords: { x: 75, y: 72 },
    zone: 'โต๊ะปฏิบัติการ B2 (โซนหลังห้อง ฝั่งขวา)',
    directions: 'จากประตูทางเข้า เดินตรงไปตามทางเดินกลาง 7 ก้าว เลี้ยวขวาเข้าโต๊ะแถวหลัง',
  },
]

// ภารกิจผู้เรียน 6 ขั้นตอน ตามระบุใน PDF:
// สังเกต → ระบุปัญหา → วิเคราะห์อย่างน้อย 3 สาเหตุ → วางแผนตรวจสอบ → เสนอ/ปฏิบัติการแก้ไข → ระบุวิธีทดสอบผล
export const MISSION_STEPS = [
  { id: 1, label: 'สังเกต', sublabel: 'Observe Symptoms' },
  { id: 2, label: 'ระบุปัญหา', sublabel: 'Define Problem' },
  { id: 3, label: 'วิเคราะห์อย่างน้อย 3 สาเหตุ', sublabel: 'Analyze 3+ Causes' },
  { id: 4, label: 'วางแผนตรวจสอบ', sublabel: 'Plan Inspection' },
  { id: 5, label: 'เสนอ/ปฏิบัติการแก้ไข', sublabel: 'Propose & Execute Fix' },
  { id: 6, label: 'ระบุวิธีทดสอบผล', sublabel: 'Verify & Record Result' },
]

// 3.2 กติกาความปลอดภัยและการทำงาน (จาก PDF)
export const SAFETY_RULES = [
  'สมาชิกทุกคนต้องมีส่วนร่วมและผลัดกันอธิบายเหตุผล',
  'ก่อนถอดหรือเสียบอุปกรณ์ภายใน ให้ปิดเครื่องและถอดปลั๊ก',
  'ไม่จับบริเวณขั้วสัมผัสของ RAM/GPU และหลีกเลี่ยงไฟฟ้าสถิต',
  'ห้ามเปลี่ยนอุปกรณ์โดยไม่มีเหตุผลหรือหลักฐานจากการตรวจสอบ',
  'เมื่อครบเวลาให้หยุดและเปลี่ยนฐานตามสัญญาณของครู',
  'ทุกฐานต้องมีการบันทึกข้อสรุปลงใบกิจกรรม',
]

export const QUICK_PROMPTS = [
  'ฉันคิดว่าเกิดจาก 3 สาเหตุนี้...',
  'ไฟที่เคสไม่ติดเลย',
  'ดู Task Manager แล้ว Disk 100%',
  'พัดลม CPU หมุนผิดปกติ',
  'RAM ถอดแล้วใส่ใหม่แล้ว',
  'ขั้นตอนต่อไปคืออะไร?',
]

