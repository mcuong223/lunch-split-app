import { useState, type FormEvent } from 'react'
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { supabase, generateMealName } from '../lib/supabase'
import MemberSelect from './MemberSelect'
import type { Member } from '../types'

interface ParticipantInput {
  name: string
  dish: string
  amount: string
}

interface Props {
  defaultDate: string
  members: Member[]
  onClose: () => void
  onSaved: () => void
  onMemberCreated: (member: Member) => void
}

const inputCls = 'w-full border-2 border-slate-100 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-600 focus:border-teal-400 dark:focus:border-teal-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150 focus:outline-none'

export default function AddMealModal({ defaultDate, members, onClose, onSaved, onMemberCreated }: Props) {
  const [payerName, setPayerName] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [totalAmount, setTotalAmount] = useState('')
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: '', dish: '', amount: '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const participantSum = participants.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const total = parseFloat(totalAmount) || 0
  const sumMismatch = total > 0 && Math.abs(participantSum - total) > 0.01

  function addParticipant() {
    setParticipants(prev => [...prev, { name: '', dish: '', amount: '' }])
  }

  function removeParticipant(index: number) {
    setParticipants(prev => prev.filter((_, i) => i !== index))
  }

  function updateParticipant(index: number, field: keyof ParticipantInput, value: string) {
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!payerName.trim()) { setError('Vui lòng nhập tên người trả'); return }
    if (participants.some(p => !p.name.trim())) { setError('Vui lòng nhập tên tất cả thành viên'); return }

    setSubmitting(true)
    setError(null)
    try {
      const mealName = await generateMealName(date)
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({ name: mealName, date, payer_name: payerName.trim(), total_amount: total || participantSum })
        .select().single()
      if (mealError) throw mealError

      const rows = [
        { meal_id: meal.id, name: payerName.trim(), dish: null, amount_owed: 0, is_paid: true, paid_at: new Date().toISOString() },
        ...participants
          .filter(p => p.name.trim().toLowerCase() !== payerName.trim().toLowerCase())
          .map(p => ({
            meal_id: meal.id,
            name: p.name.trim(),
            dish: p.dish.trim() || null,
            amount_owed: parseFloat(p.amount) || 0,
            is_paid: false,
            paid_at: null,
          })),
      ]
      const { error: partError } = await supabase.from('meal_participants').insert(rows)
      if (partError) throw partError
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
          <button onClick={onClose} aria-label="Đóng"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1" aria-labelledby="modal-title">
          <div className="px-5 py-4 space-y-4">

            {/* Người trả + Ngày */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="payer-name" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
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
                  Ngày <span aria-hidden className="text-red-400">*</span>
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
                Tổng tiền (đ)
              </label>
              <input
                id="total-amount"
                type="number"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0"
                min="0"
                className={inputCls}
              />
            </div>

            {/* Thành viên */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Thành viên <span aria-hidden className="text-red-400">*</span>
                </span>
                <button type="button" onClick={addParticipant}
                  className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  Thêm người
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_5rem_1.75rem] gap-2 mb-1.5 px-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tên</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Món</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tiền</span>
                <span />
              </div>

              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_5rem_1.75rem] gap-2 items-center">
                    <MemberSelect
                      value={p.name}
                      onChange={v => updateParticipant(i, 'name', v)}
                      members={members}
                      onMemberCreated={onMemberCreated}
                      placeholder="Tên"
                      inputClassName={inputCls}
                    />
                    <input
                      value={p.dish}
                      onChange={e => updateParticipant(i, 'dish', e.target.value)}
                      placeholder="Món ăn"
                      aria-label={`Món ăn thành viên ${i + 1}`}
                      className={inputCls}
                    />
                    <input
                      type="number"
                      value={p.amount}
                      onChange={e => updateParticipant(i, 'amount', e.target.value)}
                      placeholder="0"
                      min="0"
                      aria-label={`Số tiền thành viên ${i + 1}`}
                      className={inputCls}
                    />
                    <button type="button" onClick={() => removeParticipant(i)}
                      disabled={participants.length === 1}
                      aria-label={`Xoá thành viên ${i + 1}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tổng kiểm tra */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tổng cộng: <span className="font-bold text-slate-700 dark:text-slate-200">{participantSum.toLocaleString('vi-VN')}đ</span>
                </span>
                {sumMismatch && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    Không khớp
                  </span>
                )}
              </div>
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
