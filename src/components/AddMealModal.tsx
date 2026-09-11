import { useState, type FormEvent } from 'react'
import { X, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { supabase, generateMealName, upsertDishPrice } from '../lib/supabase'
import { useDishes } from '../hooks/useDishes'
import MemberSelect from './MemberSelect'
import DishSelect from './DishSelect'
import AIQuickInput from './AIQuickInput'
import type { Member, Dish } from '../types'
import type { ParsedMeal } from '../lib/parseWithLLM'

interface ParticipantInput {
  name: string
  dish: string
  amount: string  // in thousands, e.g. "35" = 35,000đ
}

interface Props {
  defaultDate: string
  members: Member[]
  onClose: () => void
  onSaved: () => void
  onMemberCreated: (member: Member) => void
}

const inputCls = 'w-full border-2 border-slate-100 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-600 focus:border-teal-400 dark:focus:border-teal-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150 focus:outline-none'

const toVND = (k: string) => (parseFloat(k) || 0) * 1000

export default function AddMealModal({ defaultDate, members, onClose, onSaved, onMemberCreated }: Props) {
  const [payerName, setPayerName] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [totalAmount, setTotalAmount] = useState('')
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: '', dish: '', amount: '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiInputText, setAiInputText] = useState<string | null>(null)

  const { dishes } = useDishes()

  const participantSum = participants.reduce((s, p) => s + toVND(p.amount), 0)
  const total = toVND(totalAmount)
  const sumMismatch = total > 0 && Math.abs(participantSum - total) > 0.01

  function updateParticipant(index: number, field: keyof ParticipantInput, value: string) {
    setParticipants(prev => {
      const next = prev.map((p, i) => i === index ? { ...p, [field]: value } : p)
      const last = next[next.length - 1]
      if (index === next.length - 1 && (last.name || last.dish || last.amount)) {
        return [...next, { name: '', dish: '', amount: '' }]
      }
      return next
    })
  }

  function handleDishSelected(index: number, dish: Dish) {
    setParticipants(prev => {
      const next = prev.map((p, i) => {
        if (i !== index) return p
        return {
          ...p,
          dish: dish.name,
          amount: p.amount === '' && dish.latest_price > 0
            ? String(dish.latest_price / 1000)
            : p.amount,
        }
      })
      const last = next[next.length - 1]
      if (index === next.length - 1 && (last.name || last.dish || last.amount)) {
        return [...next, { name: '', dish: '', amount: '' }]
      }
      return next
    })
  }

  function removeParticipant(index: number) {
    setParticipants(prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length === 0 ? [{ name: '', dish: '', amount: '' }] : next
    })
  }

  function matchMemberName(input: string, mems: Member[]): string {
    const lower = input.toLowerCase()
    return (
      mems.find(m => m.name.toLowerCase() === lower)?.name ??
      mems.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()))?.name ??
      input
    )
  }

  function handleAIParsed(result: ParsedMeal, rawText: string) {
    setAiInputText(rawText.trim() || null)
    if (result.payer) setPayerName(matchMemberName(result.payer, members))
    const filled = result.participants
      .map(p => ({
        name: p.name.trim() ? matchMemberName(p.name, members) : '',
        dish: p.dish,
        amount: p.amount != null ? String(p.amount) : '',
      }))
    setParticipants([...filled, { name: '', dish: '', amount: '' }])
    const sum = result.participants.reduce((s, p) => s + (p.amount ?? 0), 0)
    if (sum > 0 && !totalAmount) setTotalAmount(String(sum))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!payerName.trim()) { setError('Vui lòng nhập tên người trả'); return }

    const filledParticipants = participants.filter(p => p.name.trim())
    if (filledParticipants.length === 0) { setError('Vui lòng thêm ít nhất 1 thành viên'); return }

    setSubmitting(true)
    setError(null)
    try {
      const mealName = await generateMealName(date)
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({ name: mealName, date, payer_name: payerName.trim(), total_amount: total || participantSum, ai_input_text: aiInputText })
        .select().single()
      if (mealError) throw mealError

      const payerParticipant = filledParticipants.find(
        p => p.name.trim().toLowerCase() === payerName.trim().toLowerCase()
      )
      const rows = [
        {
          meal_id: meal.id,
          name: payerName.trim(),
          dish: payerParticipant?.dish.trim() || null,
          amount_owed: payerParticipant ? toVND(payerParticipant.amount) : 0,
          is_paid: true,
          paid_at: new Date().toISOString(),
        },
        ...filledParticipants
          .filter(p => p.name.trim().toLowerCase() !== payerName.trim().toLowerCase())
          .map(p => ({
            meal_id: meal.id,
            name: p.name.trim(),
            dish: p.dish.trim() || null,
            amount_owed: toVND(p.amount),
            is_paid: false,
            paid_at: null,
          })),
      ]
      const { error: partError } = await supabase.from('meal_participants').insert(rows)
      if (partError) throw partError

      // Best-effort dish price update — fire-and-forget, not critical
      const dishEntries = filledParticipants
        .filter(p => p.dish.trim() && parseFloat(p.amount) > 0)
        .map(p => ({ name: p.dish.trim(), latest_price: toVND(p.amount) }))
      upsertDishPrice(dishEntries).catch(() => {})

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-slate-800 dark:text-slate-100">Thêm bữa ăn</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ghi lại bữa trưa nhóm</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1" aria-labelledby="modal-title">
          <div className="px-5 py-4 space-y-4">

            {/* AI Quick Input */}
            <AIQuickInput members={members} onParsed={handleAIParsed} />

            {/* Người trả + Ngày */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Người trả <span aria-hidden className="text-red-400">*</span>
                </label>
                <MemberSelect
                  value={payerName}
                  onChange={setPayerName}
                  members={members}
                  onMemberCreated={onMemberCreated}
                  placeholder="Chọn người trả"
                  inputClassName={inputCls}
                />
              </div>
              <div>
                <label htmlFor="meal-date" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Ngày
                </label>
                <input
                  id="meal-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Tổng tiền */}
            <div>
              <label htmlFor="total-amount" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Tổng tiền <span className="normal-case font-normal text-slate-400">(nghìn đ, tuỳ chọn)</span>
              </label>
              <div className="relative">
                <input
                  id="total-amount"
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  className={`${inputCls} pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">k</span>
              </div>
              {total > 0 && (
                <p className="mt-2 text-base font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                  = {total.toLocaleString('vi-VN')}đ
                </p>
              )}
            </div>

            {/* Thành viên */}
            <div>
              <div className="mb-2.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Thành viên <span aria-hidden className="text-red-400">*</span>
                </span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_5rem_1.75rem] gap-2 mb-1.5 px-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tên</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Món</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tiền (k)</span>
                <span />
              </div>

              <div className="space-y-2">
                {participants.map((p, i) => {
                  const isGhost = i === participants.length - 1 && !p.name && !p.dish && !p.amount
                  return (
                    <div key={i} className={`grid grid-cols-[1fr_1fr_5rem_1.75rem] gap-2 items-center transition-opacity duration-150 ${isGhost ? 'opacity-50' : ''}`}>
                      <MemberSelect
                        value={p.name}
                        onChange={v => updateParticipant(i, 'name', v)}
                        members={members}
                        onMemberCreated={onMemberCreated}
                        placeholder={isGhost ? '+ Thêm' : 'Tên'}
                        inputClassName={inputCls}
                      />
                      <DishSelect
                        value={p.dish}
                        onChange={v => updateParticipant(i, 'dish', v)}
                        onDishSelected={dish => handleDishSelected(i, dish)}
                        dishes={dishes}
                        placeholder="Món ăn"
                        inputClassName={inputCls}
                      />
                      <div className="relative">
                        <input
                          type="number"
                          value={p.amount}
                          onChange={e => updateParticipant(i, 'amount', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.5"
                          aria-label={`Số tiền thành viên ${i + 1}`}
                          className={`${inputCls} pr-5`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">k</span>
                      </div>
                      {!isGhost ? (
                        <button type="button" onClick={() => removeParticipant(i)}
                          aria-label={`Xoá thành viên ${i + 1}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Tổng kiểm tra */}
              {participantSum > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    Tổng: {participantSum.toLocaleString('vi-VN')}đ
                  </span>
                  {sumMismatch && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      Không khớp
                    </span>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors cursor-pointer">
              Huỷ
            </button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-orange-200 dark:shadow-orange-900 hover:shadow-orange-300 hover:-translate-y-0.5">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Đang lưu…' : 'Lưu bữa ăn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
