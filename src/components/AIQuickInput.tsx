import { useState, useRef } from 'react'
import { Sparkles, ChevronDown, Camera, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseWithLLM } from '../lib/parseWithLLM'
import type { Member } from '../types'
import type { ParsedMeal } from '../lib/parseWithLLM'

interface Props {
  members: Member[]
  onParsed: (result: ParsedMeal) => void
}

type Phase = 'idle' | 'working' | 'done'

export default function AIQuickInput({ members, onParsed }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }

  async function handleParseClick() {
    if (!text.trim() && !imageFile) {
      setParseError('Nhập văn bản hoặc upload ảnh hoá đơn.')
      return
    }
    setParseError(null)
    setPhase('working')
    try {
      const result = await parseWithLLM(text, imageFile, members)
      if (result.participants.length === 0) {
        setParseError('Không tìm thấy thành viên nào. Thử mô tả rõ hơn hoặc nhập thủ công.')
        setPhase('idle')
        return
      }
      setPhase('done')
      onParsed(result)
      setTimeout(() => {
        setText('')
        clearImage()
        setPhase('idle')
        setExpanded(false)
      }, 1200)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Thử lại hoặc nhập thủ công.')
      setPhase('idle')
    }
  }

  const isBusy = phase === 'working'
  const canParse = (text.trim().length > 0 || imageFile !== null) && !isBusy

  return (
    <div className={`rounded-xl border-2 transition-colors duration-200 ${
      expanded
        ? 'border-teal-200 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-900/10'
        : 'border-dashed border-teal-200 dark:border-teal-800 bg-teal-50/20 dark:bg-teal-900/5'
    }`}>
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 flex-1 text-left uppercase tracking-wide">
          Nhập nhanh AI
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-teal-400 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
      </button>

      {/* Main content */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-teal-100 dark:border-teal-800 pt-3">

          {/* Textarea */}
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setParseError(null) }}
            placeholder="Ví dụ: Cuong bun bo 35k, Minh pho 40k, Nam com 30k. Cuong tra"
            rows={3}
            disabled={isBusy}
            className="w-full border-2 border-slate-100 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-700 focus:border-teal-400 dark:focus:border-teal-500 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 focus:outline-none transition-all resize-none disabled:opacity-60"
          />

          {/* Image upload row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-3 h-3" />
              {imageFile ? 'Đổi ảnh' : 'Upload hoá đơn'}
            </button>
            {imagePreview && (
              <div className="relative flex-shrink-0">
                <img src={imagePreview} alt="Receipt preview" className="w-9 h-9 object-cover rounded-lg border border-teal-200 dark:border-teal-700" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-500 hover:bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Xoá ảnh"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Working status */}
          {phase === 'working' && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin text-teal-500 flex-shrink-0" />
              <span>Đang phân tích…</span>
            </div>
          )}

          {/* Success flash */}
          {phase === 'done' && (
            <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              Đã điền vào form — kiểm tra lại trước khi lưu
            </div>
          )}

          {/* Error */}
          {parseError && (
            <div className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parse button */}
          {phase !== 'done' && (
            <button
              type="button"
              onClick={handleParseClick}
              disabled={!canParse}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-teal-200 dark:shadow-teal-900/50"
            >
              {isBusy
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              {isBusy ? 'Đang xử lý…' : 'Phân tích'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
