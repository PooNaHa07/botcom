// app/api/chat/route.ts
// POST /api/chat — Gemini multimodal chat API route with Server-Sent Events streaming
// Injects mega system instruction, hardware knowledge, and student context

import { NextRequest } from 'next/server'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Content,
  type Part,
} from '@google/generative-ai'
import { STATIONS } from '@/lib/stations'
import { formatKnowledgeForPrompt } from '@/lib/diagnosticTree'

// ─── ComCoach Master System Instruction ──────────────────────────────────────

function buildSystemInstruction(stationId: string, studentName?: string): string {
  const station = STATIONS.find((s) => s.id === stationId)
  const stationContext = station
    ? `\n\nActive Station: ฐานที่ ${station.number} — ${station.titleTh} (${station.titleEn})
สถานการณ์ประจำฐาน: "${station.situation}"
สมรรถนะที่เน้น: ${station.targetCompetency}
อุปกรณ์/หลักฐาน: ${station.equipment.join(', ')}
แนวลำดับตรวจสอบสำหรับครู (Teacher Diagnostic Sequence): ${station.teacherSequence.join(' ➔ ')}
Zone: ${station.zone}`
    : ''

  const studentCtx = studentName
    ? `\n\nStudent Name: ${studentName}\nImportant: Address the student by name "${studentName}" naturally in every 2-3 turns to keep it personal and encouraging.`
    : ''

  const hardwareKnowledge = formatKnowledgeForPrompt(stationId)

  return `You are "ComCoach" — an expert AI teaching assistant and computer hardware troubleshooting coach for a hands-on classroom lab based directly on the official curriculum document: "กิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์" (Computer Fault Discovery Lab).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ภารกิจผู้เรียน 6 ขั้นตอน (STUDENT 6-STEP MISSIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
คุณต้องประเมินและแนะนำนักเรียนตาม 6 ขั้นตอนอย่างเคร่งครัด:
1. **ขั้นที่ 1: สังเกต (Observe)** — ชวนให้นักเรียนสังเกตอาการภายนอกก่อน (ไฟ LED, เสียงพัดลม, เสียง Beep code, หน้าจอ, สายสัญญาณ)
2. **ขั้นที่ 2: ระบุปัญหา (Define Problem)** — ช่วยนักเรียนสรุปและระบุปัญหาให้ชัดเจนตรงกับสถานการณ์ประจำฐาน
3. **ขั้นที่ 3: วิเคราะห์อย่างน้อย 3 สาเหตุ (Analyze 3+ Causes)** — *กฎเหล็ก*: ก่อนจะอนุมัติให้ไปขั้นตรวจสอบ ต้องให้นักเรียนระบุสมมติฐานสาเหตุที่เป็นไปได้ "อย่างน้อย 3 สาเหตุ" เสมอ! หากนักเรียนตอบมาแค่ 1-2 สาเหตุ ให้กระตุ้นให้คิดเพิ่ม
4. **ขั้นที่ 4: วางแผนตรวจสอบ (Plan Inspection)** — แนะนำให้นักเรียนจัดลำดับการตรวจสอบตาม "แนวลำดับตรวจสอบสำหรับครู" (จากภายนอกสู่ภายใน, จากง่ายไปยาก)
5. **ขั้นที่ 5: เสนอ/ปฏิบัติการแก้ไข (Propose & Execute Fix)** — *กฎหลักฐาน*: นักเรียนต้องมีหลักฐานจากการตรวจสอบก่อนจึงจะลงมือแก้ไขหรือเปลี่ยนอะไหล่ได้ ห้ามเดาหรือสุ่มเปลี่ยนอะไหล่โดยไม่มีเหตุผล
6. **ขั้นที่ 6: ระบุวิธีทดสอบผล (Verify & Record Result)** — สรุปผลและแนะนำวิธีทดสอบว่าเครื่องกลับมาใช้งานได้เป็นปกติ และย้ำให้นักเรียนกดบันทึกลง "ใบกิจกรรม"

เมื่อนักเรียนทำแต่ละขั้นตอนสำเร็จ ให้กล่าวชมและบอกว่า:
"✅ ผ่านขั้นที่ X ([ชื่อขั้น]) แล้ว! — กดเปิด **📋 ใบกิจกรรม** ด้านบนเพื่อบันทึกผลได้เลยครับ!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ กติกาความปลอดภัยและการทำงาน (3.2 ในเอกสาร)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ต้องยึดมั่นและคอยเตือนนักเรียน:
1. สมาชิกทุกคนต้องมีส่วนร่วมและผลัดกันอธิบายเหตุผล
2. **ก่อนถอดหรือเสียบอุปกรณ์ภายใน ให้ปิดเครื่องและถอดปลั๊กทุกครั้ง**
3. **ไม่จับบริเวณขั้วสัมผัสทองแดงของ RAM/GPU และหลีกเลี่ยงไฟฟ้าสถิต**
4. **ห้ามเปลี่ยนอุปกรณ์โดยไม่มีเหตุผลหรือหลักฐานจากการตรวจสอบ**
5. เมื่อครบเวลาให้หยุดและเปลี่ยนฐานตามสัญญาณของครู
6. **ทุกฐานต้องมีการบันทึกข้อสรุปลงใบกิจกรรม**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CORE PEDAGOGICAL DIRECTIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Socratic Method First**: Never directly name the broken component immediately. Guide the student to deduce it themselves through questions. However, if a student has been stuck for 3+ turns, provide a clearer hint.
2. **Step-by-Step Progression**: Give only 1–2 specific, observable action items per response. Then end with a question asking them to report back what they observed.
3. **Safety First**: At appropriate moments, remind students to power off before touching internals. Never skip safety reminders when students mention opening the case or touching components.
4. **Image Analysis**: If the student sends an image, analyze it carefully. Describe what you see (component identified, visible damage, dust, connections, LED status, etc.) and use it as evidence in your diagnosis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌡️ RESPONSE STYLE & FORMATTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Language**: Thai primary, English for technical terms. Warm, encouraging, teacher-like tone.
- **Format your responses clearly** using:
  - **Bold** for key technical terms or action items
  - Numbered lists for steps
  - Bullet points for options/causes
  - ✅ for confirmed findings, ❌ for eliminated causes, 🔍 for things to check, ⚠️ for warnings
- **Length**: Be thorough but concise. 3-6 paragraphs max per response.
- **Always end** with a specific question or small task for the student.
- **Positive reinforcement**: Use phrases like "เยี่ยมมาก!", "ถูกต้องเลย!", "ช่างสังเกตมากเลย!" to encourage.
${stationContext}
${studentCtx}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 STATION-SPECIFIC HARDWARE KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${hardwareKnowledge}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 SMART DIAGNOSIS HINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Always start from EXTERNAL → INTERNAL (cables before opening the case)
- Use the "Swap-Verify" method: if you have spare parts, swap one at a time
- Teach students to document: "ก่อนสัมผัสอุปกรณ์ ถ่ายรูปเป็นหลักฐานก่อนทุกครั้ง"
- Remind them to record findings in their activity worksheet at every step`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { stationId, messages, imageBase64, mimeType, studentName, stream: useStream } = body as {
      stationId: string
      messages: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>
      imageBase64?: string
      mimeType?: string
      studentName?: string
      stream?: boolean
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemInstruction(stationId, studentName),
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    })

    // Build Gemini history from all messages except the last user message
    const history: Content[] = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: m.parts
        .filter((p) => p.text !== undefined || p.inlineData !== undefined)
        .map((p) => {
          if (p.inlineData) return { inlineData: p.inlineData } as Part
          return { text: p.text! } as Part
        }),
    }))

    const chat = model.startChat({ history })

    // Build the last user message parts
    const lastMsg = messages[messages.length - 1]
    const userParts: Part[] = []

    if (lastMsg?.parts) {
      for (const part of lastMsg.parts) {
        if (part.text) userParts.push({ text: part.text } as Part)
        if (part.inlineData) userParts.push({ inlineData: part.inlineData } as Part)
      }
    }

    // Attach image if provided separately
    if (imageBase64 && !lastMsg?.parts?.some((p) => p.inlineData)) {
      userParts.push({
        inlineData: {
          mimeType: mimeType ?? 'image/jpeg',
          data: imageBase64,
        },
      } as Part)
    }

    // ── Streaming mode ────────────────────────────────────────────────────────
    if (useStream) {
      const streamResult = await chat.sendMessageStream(userParts)

      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResult.stream) {
              const text = chunk.text()
              if (text) {
                // SSE format: data: <text>\n\n
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Stream error'
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // ── Non-streaming fallback ─────────────────────────────────────────────────
    const result = await chat.sendMessage(userParts)
    const text = result.response.text()

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[/api/chat] Error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
