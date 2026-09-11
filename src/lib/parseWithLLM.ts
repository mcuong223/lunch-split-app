import type { Member } from '../types'
import { getGroqClient, TEXT_MODEL, VISION_MODEL } from './groq'

export interface ParsedMeal {
  payer: string | null
  participants: Array<{
    name: string
    dish: string
    amount: number | null  // in thousands, e.g. 35 = 35,000đ
  }>
}

function buildTextPrompt(text: string, members: Member[]): string {
  const memberNames = members.length > 0 ? members.map(m => m.name).join(', ') : 'không rõ'
  return `Bạn là trợ lý phân tích chi tiêu bữa trưa nhóm. Trích xuất dữ liệu có cấu trúc từ nội dung sau.

Các thành viên đã biết: ${memberNames}

Quy tắc:
- Số tiền có "k" = nghìn VND (35k → trả về 35, không phải 35000)
- Số tiền như "35,000" hoặc "35.000" → trả về 35
- Người trả tiền được xác định bởi "[Tên] tra" hoặc "[Tên] thanh toán"
- Nếu không có người trả, đặt payer là null
- Khớp tên với danh sách thành viên đã biết khi có thể (dùng chính tả chuẩn)
- Nếu không có tên món, dùng chuỗi rỗng ""
- Nếu không có số tiền, dùng null
- Chỉ trả về JSON hợp lệ — không giải thích, không markdown code block

Nội dung:
"""
${text}
"""

Định dạng JSON bắt buộc (chỉ output cái này, không có gì khác):
{"payer":"string hoặc null","participants":[{"name":"string","dish":"string","amount":number hoặc null}]}`
}

function buildImagePrompt(members: Member[], extraText?: string): string {
  const memberNames = members.length > 0 ? members.map(m => m.name).join(', ') : 'không rõ'
  const extra = extraText?.trim() ? `\nGhi chú bổ sung: "${extraText.trim()}"` : ''
  return `Đây là ảnh hoá đơn bữa ăn nhóm. Phân tích và trích xuất thông tin chi tiêu.${extra}

Các thành viên đã biết: ${memberNames}

Quy tắc:
- Số tiền đơn vị nghìn VND (35,000đ → 35; 40k → 40)
- Nếu không rõ người trả, đặt payer là null
- Khớp tên với danh sách thành viên đã biết khi có thể
- Nếu không có tên món, dùng chuỗi rỗng ""
- Nếu không có số tiền, dùng null
- Chỉ trả về JSON hợp lệ — không giải thích, không markdown

Định dạng JSON bắt buộc (chỉ output cái này, không có gì khác):
{"payer":"string hoặc null","participants":[{"name":"string","dish":"string","amount":number hoặc null}]}`
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractParsedMeal(raw: string): ParsedMeal {
  console.log('[AI raw response]', raw)
  // Strip thinking tags (case-insensitive, optional attributes)
  let text = raw.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, '').trim()
  // Strip markdown code fences
  text = text.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/g, '$1').trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI không trả về JSON hợp lệ. Thử lại hoặc nhập thủ công.')

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error('Không thể đọc kết quả từ AI. Thử lại hoặc nhập thủ công.')
  }

  if (
    typeof parsed !== 'object' || parsed === null ||
    !('participants' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).participants)
  ) {
    throw new Error('Kết quả AI không đúng định dạng. Thử lại hoặc nhập thủ công.')
  }

  const raw2 = parsed as { payer?: unknown; participants: unknown[] }
  return {
    payer: typeof raw2.payer === 'string' && raw2.payer ? raw2.payer : null,
    participants: raw2.participants
      .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
      .filter(p => typeof p['name'] === 'string' && (p['name'] as string).trim())
      .map(p => ({
        name: (p['name'] as string).trim(),
        dish: typeof p['dish'] === 'string' ? p['dish'].trim() : '',
        amount: typeof p['amount'] === 'number' && !isNaN(p['amount']) ? p['amount'] : null,
      })),
  }
}

export async function parseWithLLM(
  text: string,
  image: File | null,
  members: Member[],
): Promise<ParsedMeal> {
  const client = getGroqClient()

  let responseText: string

  if (image) {
    const base64 = await fileToBase64(image)
    const completion = await (client.chat.completions.create as Function)({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${image.type};base64,${base64}` },
          },
          {
            type: 'text',
            text: buildImagePrompt(members, text),
          },
        ],
      }],
      temperature: 0.1,
      max_tokens: 2048,
      reasoning_effort: 'low',
    })
    responseText = completion.choices[0].message.content ?? ''
  } else {
    const completion = await (client.chat.completions.create as Function)({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: buildTextPrompt(text, members) }],
      temperature: 0.1,
      max_tokens: 2048,
      reasoning_effort: 'low',
    })
    responseText = completion.choices[0].message.content ?? ''
  }

  return extractParsedMeal(responseText)
}
