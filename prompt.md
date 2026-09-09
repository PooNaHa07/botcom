Act as a Senior Full-Stack Engineer and EdTech Solutions Architect. Build a responsive, classroom-focused Web Chatbot Application called "ComCoach" designed to guide students through a computer troubleshooting lab activity.

### 1. Technology Stack

- **Frontend Framework:** Vue 3 (Composition API with `<script setup>`) + Vite OR Next.js (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS (Modern clean UI, Dark Mode support, Glassmorphism touches, Lucide Icons)
- **Backend / API:** Server Routes (Next.js API route or Node.js / Hono)
- **AI Integration:** Google Gemini API (`@google/genai` or `@google/generative-ai` SDK, using `gemini-1.5-flash` or `gemini-2.0-flash`)
- **State Management / Storage:** Pinia (if Vue) / React Context, saving conversation logs and selected station into LocalStorage (with optional Supabase logging integration).

---

### 2. Core Functional Requirements

#### A. Station Selector & Scenario Hub (Activity Stations)

Provide a quick-select station drawer or header selector matching the 4 lab stations:

- **Station 1:** เปิดไม่ติด ไฟไม่มา (No Power / No Fan / No Lights)
- **Station 2:** เครื่องติด แต่จอมืด (Power On, Fan Spins, Black Screen)
- **Station 3:** เครื่องดับหรือ Restart เอง (Random Shutdown / Auto Restart)
- **Station 4:** เครื่องทำงานช้า (System Slow / High Usage / Lag)
  Selecting a station immediately sets the station context in the chat session and displays a brief objective card.

#### B. Chat Interface (Interactive Coach)

- **Message Stream:** Support text and image upload (e.g., student uploads a photo of their PC interior, motherboard, cable ports, or Task Manager screenshot).
- **Multimodal Support:** Convert uploaded images to base64 inlineData and pass to Gemini alongside the student's prompt.
- **Troubleshooting Checklist Tracker (Sidebar / Accordion):**
  A visual interactive checklist based on the 5-step mission:
  [ ] 1. สังเกตและระบุปัญหา (Identify Symptom)
  [ ] 2. วิเคราะห์อย่างน้อย 3 สาเหตุ (Brainstorm 3 Causes)
  [ ] 3. วางแผนตรวจสอบ (Plan Inspection)
  [ ] 4. ปฏิบัติการแก้ไขโดยมีหลักฐาน (Take Action with Evidence)
  [ ] 5. ทดสอบผลและบันทึกใบกิจกรรม (Verify & Record)
- **Safety Alert Banner:** A persistent badge reminding students:
  "⚠️ ความปลอดภัยสำคัญที่สุด: ปิดเครื่องและถอดปลั๊กก่อนสัมผัสอุปกรณ์ภายใน | ห้ามจับขั้วสัมผัสทองแดง RAM/GPU"

#### C. Backend API Route (`/api/chat`)

- Implement a POST endpoint receiving: `{ stationId: string, messages: Array<{ role: 'user' | 'model', parts: any }>, imageBase64?: string }`.
- Inject the **ComCoach Master System Instruction** into Gemini config.
- Stream or return the response safely with error handling and retry mechanisms.

---

### 3. Embedded AI System Instruction (Must be injected into the Gemini API call)

"""
You are "ComCoach", an AI coach for a hands-on classroom activity titled "กิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์".

Pedagogical Directives:

1. Socratic Method: NEVER give direct answers or name the broken component immediately. Ask guiding questions to lead students to deduce the cause.
2. 3-Cause Rule: Always challenge the student to formulate at least 3 plausible root causes before agreeing to any hardware modification.
3. Evidence-First Rule: If a student proposes to replace/swap parts (e.g., RAM, PSU), prompt them: "มีหลักฐานหรือผลการตรวจสอบอะไรที่ชี้ว่าชิ้นส่วนนี้เสีย?" No component may be swapped without empirical evidence.
4. Step-by-Step: Provide only 1-2 small, observable action items per turn, then prompt the student to report back what happened.
5. Safety Priority: Emphasize pulling the plug before touching internals, never touch gold contacts of RAM/GPU, and always remind them to record findings in their activity sheet.

Station Knowledge Hierarchy:

- Station 1 (เปิดไม่ติด ไฟไม่มา): Power cables/wall plug -> PSU switch/fan -> Front panel Power Switch -> Mainboard.
- Station 2 (เครื่องติด แต่จอมืด): Display power/cables/ports -> RAM slots/contacts -> GPU/VGA -> Mainboard.
- Station 3 (ดับ/Restart เอง): CPU fan/thermals/heatsink dust -> PSU power stability -> RAM errors -> Software/OS.
- Station 4 (เครื่องทำงานช้า): Task Manager (CPU/RAM/Disk %) -> Startup items/disk free space -> Storage health/Malware.
  """

---

### 4. UI/UX Design Specifications

- **Theme:** Clean educational layout, deep slate/neutral background with soft accents (Emerald for safe status, Amber for warning/safety reminders).
- **Layout:**
  - Header: Logo, Activity Title, Active Station Badge, "Reset Chat" button.
  - Left/Drawer Panel (Collapsible): Mission progress indicator, Station switcher, and Classroom Safety Rules.
  - Main Area: Message history with distinct bubbles (Student vs. Coach), auto-scroll to bottom, typing/loading indicator, and an input bar equipped with:
    - Textarea with auto-resize and Enter-to-submit.
    - Image attachment button (preview thumbnail before sending).
    - Quick prompt chips (e.g., "หนูคิดว่าเกิดจาก 3 สาเหตุนี้...", "ไฟที่เคสไม่ติดเลย", "ดู Task Manager แล้ว Disk 100%").

---

### 5. Output Deliverables

1. Complete Project Structure.
2. Installation commands and environment variable setups (`.env.example` with `GEMINI_API_KEY`).
3. Core frontend components (Vue 3 or React/Next.js).
4. Backend API route code handling multimodal inputs and conversation history.
5. Clean, production-ready code with helpful inline comments in Thai/English.
