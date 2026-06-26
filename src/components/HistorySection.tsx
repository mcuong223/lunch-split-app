import { forwardRef, useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Clock, ChevronsDown } from 'lucide-react'
import { useAllMeals } from '../hooks/useMeals'
import MealCard from './MealCard'
import type { Member } from '../types'

interface Props {
  today: string
  members: Member[]
  mealAddedKey: number
  onParticipantChanged: () => void
}

const MEALS_PER_PAGE = 5

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const HistorySection = forwardRef<HTMLElement, Props>(({ today, members, mealAddedKey, onParticipantChanged }, ref) => {
  const { mealsByDate, loading, refetch } = useAllMeals()
  const [open, setOpen] = useState(true)
  const [visibleMealCount, setVisibleMealCount] = useState(MEALS_PER_PAGE)

  useEffect(() => {
    if (mealAddedKey > 0) refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealAddedKey])

  const pastDates = Object.keys(mealsByDate)
    .filter(d => d < today)
    .sort((a, b) => b.localeCompare(a))

  // Build visible dates up to visibleMealCount meals (never cut a date group)
  let shownMeals = 0
  const visibleDates: string[] = []
  for (const date of pastDates) {
    if (shownMeals >= visibleMealCount) break
    visibleDates.push(date)
    shownMeals += mealsByDate[date].length
  }

  const totalMeals = pastDates.reduce((sum, d) => sum + mealsByDate[d].length, 0)
  const hasMore = shownMeals < totalMeals
  const remainingCount = totalMeals - shownMeals

  function handleMealMutated() {
    refetch()
    onParticipantChanged()
  }

  return (
    <section ref={ref} className="pt-4 pb-4">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 mb-4 cursor-pointer group w-full"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full group-hover:bg-teal-400 transition-colors duration-150" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors duration-150">
            Lịch sử
          </span>
        </div>
        <div className="text-slate-300 dark:text-slate-600 group-hover:text-teal-400 transition-colors duration-150">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-2xl card-shadow" />
            ))}
          </div>
        ) : pastDates.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium pl-3.5">Chưa có lịch sử.</p>
        ) : (
          <div className="space-y-8">
            {visibleDates.map(date => (
              <DateGroup
                key={date}
                date={date}
                meals={mealsByDate[date]}
                members={members}
                onParticipantChanged={onParticipantChanged}
                onMealMutated={handleMealMutated}
              />
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleMealCount(prev => prev + MEALS_PER_PAGE)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 cursor-pointer"
              >
                <ChevronsDown className="w-4 h-4" />
                Xem thêm ({remainingCount} bữa)
              </button>
            )}
          </div>
        )
      )}
    </section>
  )
})

function DateGroup({
  date,
  meals,
  members,
  onParticipantChanged,
  onMealMutated,
}: {
  date: string
  meals: ReturnType<typeof useAllMeals>['mealsByDate'][string]
  members: Member[]
  onParticipantChanged: () => void
  onMealMutated: () => void
}) {
  const getUnpaidIds = (ms: typeof meals) => new Set(
    ms.flatMap(m => (m.meal_participants ?? [])
      .filter(p => !p.is_paid && p.name !== m.payer_name)
      .map(p => p.id))
  )
  const [unpaidIds, setUnpaidIds] = useState(() => getUnpaidIds(meals))
  useEffect(() => { setUnpaidIds(getUnpaidIds(meals)) }, [meals])

  function handleParticipantChanged(participantId: string, isPaid: boolean) {
    setUnpaidIds(prev => {
      const next = new Set(prev)
      if (isPaid) next.delete(participantId)
      else next.add(participantId)
      return next
    })
  }

  const unpaid = unpaidIds.size > 0

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3 pl-1">
        <div className={`w-1 h-4 rounded-full transition-colors duration-300 ${unpaid ? 'bg-amber-400' : 'bg-teal-300 dark:bg-teal-600'}`} />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateLabel(date)}</span>
        {unpaid ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-semibold">
            <Clock className="w-3 h-3" />
            Chưa xong
          </span>
        ) : (
          <span className="text-xs text-teal-500 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full border border-teal-100 dark:border-teal-800">
            Hoàn tất
          </span>
        )}
      </div>
      <div className="space-y-3">
        {meals.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            members={members}
            onParticipantChanged={(id, isPaid) => handleParticipantChanged(id, isPaid)}
            onParticipantSettled={onParticipantChanged}
            onDeleted={onMealMutated}
            onEdited={onMealMutated}
          />
        ))}
      </div>
    </div>
  )
}

HistorySection.displayName = 'HistorySection'
export default HistorySection
