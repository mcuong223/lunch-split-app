import { useState } from 'react'
import { Users, CheckCircle2, Clock } from 'lucide-react'
import type { MealWithParticipants, MealParticipant } from '../types'
import ParticipantRow from './ParticipantRow'

interface Props {
  meal: MealWithParticipants
  // Called after a participant is toggled — passes id + new paid state
  onParticipantChanged?: (participantId: string, isPaid: boolean) => void
}

export default function MealCard({ meal, onParticipantChanged }: Props) {
  const [participants, setParticipants] = useState<MealParticipant[]>(
    () => meal.meal_participants ?? []
  )

  function handleToggle(participantId: string, isPaid: boolean) {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId
          ? { ...p, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null }
          : p
      )
    )
    onParticipantChanged?.(participantId, isPaid)
  }

  function handleRevert(participantId: string, originalIsPaid: boolean, originalPaidAt: string | null) {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId
          ? { ...p, is_paid: originalIsPaid, paid_at: originalPaidAt }
          : p
      )
    )
    onParticipantChanged?.(participantId, originalIsPaid)
  }

  const nonPayer = participants.filter(p => !(p.name === meal.payer_name && p.amount_owed === 0))
  const paidCount = nonPayer.filter(p => p.is_paid).length
  const allPaid = nonPayer.length > 0 && paidCount === nonPayer.length
  const progressPct = nonPayer.length > 0 ? (paidCount / nonPayer.length) * 100 : 100

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        allPaid ? 'card-shadow-paid' : 'card-shadow hover:card-shadow-hover'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full transition-all duration-500 ${
        allPaid
          ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
          : 'bg-gradient-to-r from-orange-300 to-orange-400'
      }`} />

      <div className={`transition-colors duration-500 ${allPaid ? 'bg-gradient-to-br from-teal-50/60 to-white' : 'bg-white'}`}>
        {/* Card header */}
        <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">{meal.name}</h3>
              {allPaid && (
                <span className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Settled
                </span>
              )}
              {!allPaid && paidCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-semibold border border-orange-100">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Paid by {meal.payer_name}
              </span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {meal.total_amount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-teal-600 flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>{paidCount}<span className="text-teal-400 font-normal">/{nonPayer.length}</span></span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-4 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allPaid
                ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                : 'bg-gradient-to-r from-orange-300 to-orange-500'
            }`}
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={paidCount}
            aria-valuemax={nonPayer.length}
            aria-label={`${paidCount} of ${nonPayer.length} paid`}
          />
        </div>

        {/* Participant list */}
        <div className="px-4 pt-1 pb-2 divide-y divide-slate-100/80">
          {participants.map(p => (
            <ParticipantRow
              key={p.id}
              participant={p}
              payerName={meal.payer_name}
              onToggle={(isPaid) => handleToggle(p.id, isPaid)}
              onRevert={(originalIsPaid, originalPaidAt) => handleRevert(p.id, originalIsPaid, originalPaidAt)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
