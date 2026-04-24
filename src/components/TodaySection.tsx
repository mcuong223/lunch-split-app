import { useState } from 'react'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { useMeals } from '../hooks/useMeals'
import MealCard from './MealCard'
import AddMealModal from './AddMealModal'
import type { Member } from '../types'

interface Props {
  today: string
  members: Member[]
  onMealAdded: () => void
  onParticipantChanged: () => void
  onMemberCreated: () => void
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl card-shadow p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg w-28" />
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-40" />
        </div>
        <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-10" />
      </div>
      <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mb-4" />
      <div className="space-y-2.5">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-20" />
          <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-16" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-24" />
          <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

export default function TodaySection({ today, members, onMealAdded, onParticipantChanged, onMemberCreated }: Props) {
  const { meals, loading, refetch } = useMeals(today)
  const [showModal, setShowModal] = useState(false)

  function handleSaved() {
    setShowModal(false)
    refetch()
    onMealAdded()
  }

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <section className="pt-5 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-teal-500 dark:text-teal-400">Hôm nay</span>
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">{todayLabel}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 text-sm bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-orange-200 dark:shadow-orange-900 hover:shadow-orange-300 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Thêm bữa
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200/60 dark:from-teal-900/40 dark:to-teal-800/20 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <UtensilsCrossed className="w-7 h-7 text-teal-500 dark:text-teal-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có bữa nào hôm nay</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Nhấn "Thêm bữa" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              members={members}
              onParticipantChanged={() => onParticipantChanged()}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddMealModal
          defaultDate={today}
          members={members}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
          onMemberCreated={() => { onMemberCreated() }}
        />
      )}
    </section>
  )
}
