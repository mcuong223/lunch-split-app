import { Utensils, Moon, Sun, Users } from 'lucide-react'

interface Props {
  dark: boolean
  onToggleDark: () => void
  onOpenMembers: () => void
}

export default function Header({ dark, onToggleDark, onOpenMembers }: Props) {
  const now = new Date()
  const dateLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-teal-100/60 dark:border-slate-700/60">
      <div className="max-w-xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Về đầu trang"
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity duration-150"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-sm shadow-teal-200 dark:shadow-teal-900 flex-shrink-0">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-base font-bold text-teal-900 dark:text-teal-100 tracking-tight">Televate Lunch Split</span>
            <p className="text-xs text-teal-600/70 dark:text-teal-400/70 hidden sm:block leading-none mt-0.5">{dateLabel}</p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenMembers}
            aria-label="Quản lý thành viên"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 transition-colors duration-150 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thành viên</span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={dark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150 cursor-pointer"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
