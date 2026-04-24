import { useState, type FormEvent } from 'react'
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { supabase, generateMealName } from '../lib/supabase'

interface ParticipantInput {
  name: string
  dish: string
  amount: string
}

interface Props {
  defaultDate: string
  onClose: () => void
  onSaved: () => void
}

const inputCls = 'w-full border-2 border-slate-100 hover:border-teal-200 focus:border-teal-400 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 bg-slate-50/50 focus:bg-white transition-all duration-150 focus:outline-none'

export default function AddMealModal({ defaultDate, onClose, onSaved }: Props) {
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
    if (!payerName.trim()) { setError('Payer name is required'); return }
    if (participants.length === 0) { setError('At least one participant is required'); return }
    if (participants.some(p => !p.name.trim())) { setError('All participant names are required'); return }

    setSubmitting(true)
    setError(null)

    try {
      const mealName = await generateMealName(date)

      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          name: mealName,
          date,
          payer_name: payerName.trim(),
          total_amount: total || participantSum,
        })
        .select()
        .single()

      if (mealError) throw mealError

      const rows = [
        {
          meal_id: meal.id,
          name: payerName.trim(),
          dish: null,
          amount_owed: 0,
          is_paid: true,
          paid_at: new Date().toISOString(),
        },
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
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-slate-800">Add Meal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Record a group lunch</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors duration-150 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1" aria-labelledby="modal-title">
          <div className="px-5 py-4 space-y-4">

            {/* Payer + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="payer-name" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Paid by <span aria-hidden className="text-red-400">*</span>
                </label>
                <input
                  id="payer-name"
                  value={payerName}
                  onChange={e => setPayerName(e.target.value)}
                  placeholder="Name"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="meal-date" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Date <span aria-hidden className="text-red-400">*</span>
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

            {/* Total */}
            <div>
              <label htmlFor="total-amount" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                Total Amount (đ)
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

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Participants <span aria-hidden className="text-red-400">*</span>
                </span>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-bold transition-colors duration-150 cursor-pointer bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add person
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_5rem_1.75rem] gap-2 mb-1.5 px-1">
                <span className="text-xs font-semibold text-slate-400">Name</span>
                <span className="text-xs font-semibold text-slate-400">Dish</span>
                <span className="text-xs font-semibold text-slate-400">Amount</span>
                <span />
              </div>

              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_5rem_1.75rem] gap-2 items-center">
                    <input
                      value={p.name}
                      onChange={e => updateParticipant(i, 'name', e.target.value)}
                      placeholder="Name"
                      aria-label={`Participant ${i + 1} name`}
                      className={inputCls}
                    />
                    <input
                      value={p.dish}
                      onChange={e => updateParticipant(i, 'dish', e.target.value)}
                      placeholder="Dish"
                      aria-label={`Participant ${i + 1} dish`}
                      className={inputCls}
                    />
                    <input
                      type="number"
                      value={p.amount}
                      onChange={e => updateParticipant(i, 'amount', e.target.value)}
                      placeholder="0"
                      min="0"
                      aria-label={`Participant ${i + 1} amount`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeParticipant(i)}
                      disabled={participants.length === 1}
                      aria-label={`Remove participant ${i + 1}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Sum row */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Sum: <span className="font-bold text-slate-700">{participantSum.toLocaleString('vi-VN')}đ</span>
                </span>
                {sumMismatch && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    Sum mismatch
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-semibold transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Saving…' : 'Save Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
