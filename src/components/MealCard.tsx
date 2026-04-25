import { useState } from 'react'
import { Users, CheckCircle2, Clock, Smartphone, QrCode, X, Banknote, ChevronDown } from 'lucide-react'
import type { MealWithParticipants, MealParticipant, Member } from '../types'
import ParticipantRow from './ParticipantRow'

interface Props {
  meal: MealWithParticipants
  members: Member[]
  onParticipantChanged?: (participantId: string, isPaid: boolean) => void
  pinTransfer?: boolean  // true = always show transfer info, no toggle (for Today cards)
}

export default function MealCard({ meal, members, onParticipantChanged, pinTransfer = false }: Props) {
  const [participants, setParticipants] = useState<MealParticipant[]>(
    () => meal.meal_participants ?? []
  )
  const [showQr, setShowQr] = useState(false)
  const [showTransfer, setShowTransfer] = useState(pinTransfer)

  const payer = members.find(m => m.name.toLowerCase() === meal.payer_name.toLowerCase())
  const hasTransferInfo = payer && (payer.momo_phone || payer.qr_image_url)

  function handleToggle(participantId: string, isPaid: boolean) {
    setParticipants(prev =>
      prev.map(p => p.id === participantId
        ? { ...p, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null }
        : p
      )
    )
    onParticipantChanged?.(participantId, isPaid)
  }

  function handleRevert(participantId: string, originalIsPaid: boolean, originalPaidAt: string | null) {
    setParticipants(prev =>
      prev.map(p => p.id === participantId
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
    <>
      <div className={`rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        allPaid ? 'card-shadow-paid' : 'card-shadow hover:card-shadow-hover'
      }`}>
        {/* Top accent bar */}
        <div className={`h-1 w-full transition-all duration-500 ${
          allPaid
            ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
            : 'bg-gradient-to-r from-orange-300 to-orange-400'
        }`} />

        <div className={`transition-colors duration-500 ${
          allPaid
            ? 'bg-gradient-to-br from-teal-50/60 to-white dark:from-teal-900/20 dark:to-slate-800'
            : 'bg-white dark:bg-slate-800'
        }`}>
          {/* Header */}
          <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">{meal.name}</h3>
                {allPaid && (
                  <span className="inline-flex items-center gap-1 text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã xong
                  </span>
                )}
                {!allPaid && paidCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold border border-orange-100 dark:border-orange-800">
                    <Clock className="w-3 h-3" />
                    Chờ thanh toán
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  Trả bởi {meal.payer_name}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {meal.total_amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 flex-shrink-0">
              <Users className="w-3.5 h-3.5" />
              <span>{paidCount}<span className="text-teal-400 dark:text-teal-600 font-normal">/{nonPayer.length}</span></span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mx-4 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
              aria-label={`${paidCount} / ${nonPayer.length} đã trả`}
            />
          </div>

          {/* Participant list */}
          <div className="px-4 pt-1 pb-2 divide-y divide-slate-100/80 dark:divide-slate-700/80">
            {participants.map(p => (
              <ParticipantRow
                key={p.id}
                participant={p}
                payerName={meal.payer_name}
                onToggle={(isPaid) => handleToggle(p.id, isPaid)}
                onRevert={(orig, origAt) => handleRevert(p.id, orig, origAt)}
              />
            ))}
          </div>

          {/* Thông tin chuyển khoản */}
          <div className="mx-4 pb-3 mt-0.5">
            {pinTransfer ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium py-1">
                <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Chuyển khoản cho {meal.payer_name}</span>
                {hasTransferInfo && (
                  <span className="ml-1 w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0" />
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTransfer(s => !s)}
                className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer transition-colors duration-150 w-full py-1"
              >
                <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Chuyển khoản cho {meal.payer_name}</span>
                {hasTransferInfo && (
                  <span className="ml-1 w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0" />
                )}
                <ChevronDown className={`w-3.5 h-3.5 ml-auto flex-shrink-0 transition-transform duration-200 ${showTransfer ? '' : '-rotate-90'}`} />
              </button>
            )}

            {showTransfer && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 px-3 py-2.5 mt-1">
                {hasTransferInfo ? (
                  <div className="flex items-center flex-wrap gap-2">
                    {payer?.momo_phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-2.5 py-1 rounded-full font-semibold">
                        <Smartphone className="w-3 h-3" />
                        {payer.momo_phone}
                        <span className="text-pink-400 dark:text-pink-500 font-normal">MoMo</span>
                      </span>
                    )}
                    {payer?.qr_image_url && (
                      <button
                        type="button"
                        onClick={() => setShowQr(true)}
                        className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-full font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        <QrCode className="w-3 h-3" />
                        Xem mã QR
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Chưa có thông tin thanh toán — thêm trong mục Thành viên
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR lightbox */}
      {showQr && payer?.qr_image_url && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowQr(false)}
        >
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 text-center">
              QR — {payer.name}
            </p>
            <img src={payer.qr_image_url} alt={`QR ${payer.name}`} className="w-full rounded-xl" />
            {payer.momo_phone && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-pink-500 dark:text-pink-400 font-semibold">
                <Smartphone className="w-4 h-4" />
                {payer.momo_phone}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
