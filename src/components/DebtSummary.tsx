import { useState } from 'react'
import { ArrowRight, Info, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { markPaidBulk } from '../lib/supabase'
import type { DebtGroup } from '../types'

interface Props {
  groups: DebtGroup[]
  loading: boolean
  onSettled: () => void
}

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function DebtRow({ group, onSettled }: { group: DebtGroup; onSettled: () => void }) {
  const [showInfo, setShowInfo] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setPaying(true)
    setError(null)
    try {
      await markPaidBulk(group.items.map(i => i.participantId))
      onSettled()
    } catch {
      setError('Lỗi, thử lại')
      setPaying(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
        {/* Names */}
        <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{group.debtor}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{group.creditor}</span>
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums flex-1">
            {group.total.toLocaleString('vi-VN')}đ
          </span>

          {/* Info toggle */}
          <button
            type="button"
            onClick={() => setShowInfo(v => !v)}
            title="Xem chi tiết"
            className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 cursor-pointer
              ${showInfo ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Pay button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0 cursor-pointer"
          >
            {paying && <Loader2 className="w-3 h-3 animate-spin" />}
            Trả hết
          </button>
        </div>
      </div>

      {/* Breakdown */}
      {showInfo && (
        <div className="mx-3 mb-1 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
          {group.items.map((item, i) => (
            <div key={item.participantId} className={`flex items-center justify-between px-3 py-1.5 text-xs ${i > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''}`}>
              <span className="text-slate-500 dark:text-slate-400">
                {item.mealName} <span className="text-slate-400 dark:text-slate-500">({formatDate(item.mealDate)})</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                {item.amount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mx-3 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default function DebtSummary({ groups, loading, onSettled }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (!loading && groups.length === 0) return null

  return (
    <section className="mb-4">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-1 py-2 cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Tổng nợ chưa trả</span>
          {!loading && (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {groups.length} khoản
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          : <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        }
      </button>

      {!collapsed && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="space-y-px p-2 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-1">
              {groups.map((g, i) => (
                <div key={`${g.debtor}||${g.creditor}`}>
                  {i > 0 && <div className="h-px bg-slate-100 dark:bg-slate-700 mx-3" />}
                  <DebtRow group={g} onSettled={onSettled} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
