import { useState } from 'react'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { useMeals } from '../hooks/useMeals'
import MealCard from './MealCard'
import AddMealModal from './AddMealModal'

interface Props {
  today: string
  onMealAdded: () => void
  onParticipantChanged: () => void
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl card-shadow p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-100 rounded-lg w-28" />
          <div className="h-3 bg-slate-100 rounded-lg w-40" />
        </div>
        <div className="h-5 bg-slate-100 rounded-full w-10" />
      </div>
      <div className="h-1 bg-slate-100 rounded-full mb-4" />
      <div className="space-y-2.5">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-5 bg-slate-100 rounded-full w-16" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-5 bg-slate-100 rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

export default function TodaySection({ today, onMealAdded, onParticipantChanged }: Props) {
  const { meals, loading, refetch } = useMeals(today)
  const [showModal, setShowModal] = useState(false)

  function handleSaved() {
    setShowModal(false)
    refetch()
    onMealAdded()
  }

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <section className="pt-5 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-teal-500">Today</span>
          </div>
          <p className="text-base font-bold text-slate-800 mt-0.5">{todayLabel}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 text-sm bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Meal
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200/60 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <UtensilsCrossed className="w-7 h-7 text-teal-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No meals yet today</p>
          <p className="text-xs text-slate-400 mt-1">Tap "Add Meal" to record the first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onParticipantChanged={() => onParticipantChanged()}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddMealModal
          defaultDate={today}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
