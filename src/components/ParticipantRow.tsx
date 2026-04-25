import { useState } from 'react'
import { Check, Crown, Loader2, RotateCcw } from 'lucide-react'
import { markPaid, markUnpaid } from '../lib/supabase'
import type { MealParticipant } from '../types'

interface Props {
  participant: MealParticipant
  payerName: string
  onToggle: (isPaid: boolean) => void
  onRevert: (originalIsPaid: boolean, originalPaidAt: string | null) => void
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export default function ParticipantRow({ participant, payerName, onToggle, onRevert }: Props) {
  const [loading, setLoading] = useState(false)

  const isPayer = participant.name === payerName && participant.amount_owed === 0
  const isPaid = participant.is_paid

  async function handleMarkPaid() {
    const prev = { is_paid: participant.is_paid, paid_at: participant.paid_at }
    onToggle(true)
    setLoading(true)
    try {
      await markPaid(participant.id)
    } catch {
      onRevert(prev.is_paid, prev.paid_at)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkUnpaid() {
    const prev = { is_paid: participant.is_paid, paid_at: participant.paid_at }
    onToggle(false)
    setLoading(true)
    try {
      await markUnpaid(participant.id)
    } catch {
      onRevert(prev.is_paid, prev.paid_at)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      {/* Tên + món */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`text-sm font-semibold truncate transition-colors duration-200 ${
          isPaid || isPayer
            ? 'text-teal-700/70 dark:text-teal-500/70'
            : 'text-slate-800 dark:text-slate-100'
        }`}>
          {participant.name}
        </span>
        {participant.dish && (
          <span className="text-xs italic text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {participant.dish}
          </span>
        )}
      </div>

      {/* Tiền + trạng thái */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isPayer && (
          <span className={`text-sm font-bold tabular-nums font-mono tracking-tight transition-all duration-200 ${
            isPaid
              ? 'text-teal-500/50 dark:text-teal-600/50 line-through'
              : 'text-slate-700 dark:text-slate-200'
          }`}>
            {formatAmount(participant.amount_owed)}
          </span>
        )}

        {isPayer ? (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full font-semibold">
            <Crown className="w-3 h-3" />
            Trả tiền
          </span>
        ) : isPaid ? (
          <button
            onClick={handleMarkUnpaid}
            disabled={loading}
            aria-label={`Đánh dấu ${participant.name} chưa trả`}
            title="Nhấn để huỷ"
            className="group inline-flex items-center gap-1 text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-60 px-2.5 py-1 rounded-full font-semibold transition-all duration-200 cursor-pointer"
          >
            {loading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <>
                  <Check className="w-3 h-3 group-hover:hidden" />
                  <RotateCcw className="w-3 h-3 hidden group-hover:block" />
                </>
            }
            <span className="group-hover:hidden">Đã trả</span>
            <span className="hidden group-hover:inline">{loading ? 'Đang lưu…' : 'Hoàn tác'}</span>
          </button>
        ) : (
          <button
            onClick={handleMarkPaid}
            disabled={loading}
            aria-label={`Đánh dấu ${participant.name} đã trả`}
            className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer shadow-sm shadow-orange-200 dark:shadow-orange-900 hover:shadow-orange-300 hover:-translate-y-0.5"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {loading ? 'Đang lưu…' : 'Trả tiền'}
          </button>
        )}
      </div>
    </div>
  )
}
