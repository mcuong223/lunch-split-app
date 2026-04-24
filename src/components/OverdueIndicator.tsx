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
      aria-label={`${count} khoản chưa thanh toán từ ngày trước — nhấn để xem lịch sử`}
      className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200/80 dark:border-amber-800/60 px-4 py-3 flex items-center gap-3 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors duration-200 cursor-pointer group"
    >
      <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      </div>
      <p className="flex-1 text-left text-sm text-amber-900 dark:text-amber-200">
        <span className="font-semibold">{count} khoản</span>
        <span className="text-amber-700/80 dark:text-amber-300/80"> chưa thanh toán từ ngày trước</span>
      </p>
      <ArrowRight className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform duration-150 flex-shrink-0" />
    </button>
  )
}
