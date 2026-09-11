import Groq from 'groq-sdk'

let _client: Groq | null = null

export function getGroqClient(): Groq {
  if (_client) return _client
  const key = import.meta.env.VITE_GROQ_API_KEY as string
  if (!key) throw new Error('Chưa cấu hình VITE_GROQ_API_KEY trong file .env')
  _client = new Groq({ apiKey: key, dangerouslyAllowBrowser: true })
  return _client
}

export const TEXT_MODEL = 'llama-3.1-8b-instant'
export const VISION_MODEL = 'qwen/qwen3.6-27b'
