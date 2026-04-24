import { Utensils } from 'lucide-react'

export default function Header() {
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-teal-100/60">
      <div className="max-w-xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-sm shadow-teal-200 flex-shrink-0">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-teal-900 tracking-tight">Lunch Split</span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-teal-600/80">{dateLabel}</p>
        </div>
      </div>
    </header>
  )
}
