import { AlertTriangle, ArrowRight } from 'lucide-react'

interface Props {
  count: number
  onScrollToHistory: () => void
}

export default function OverdueIndicator({ count, onScrollToHistory }: Props) {
  if (count === 0) return null

  return (
    <button
      onClick={onScrollToHistory}
      aria-label={`${count} unpaid items from previous days — click to view history`}
      className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-4 py-3 flex items-center gap-3 hover:from-amber-100 hover:to-orange-100 transition-colors duration-200 cursor-pointer group"
    >
      <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      </div>
      <p className="flex-1 text-left text-sm text-amber-900">
        <span className="font-semibold">{count} unpaid {count === 1 ? 'item' : 'items'}</span>
        <span className="text-amber-700/80"> from previous days</span>
      </p>
      <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-150 flex-shrink-0" />
    </button>
  )
}
