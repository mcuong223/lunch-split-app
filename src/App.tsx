import { useEffect, useRef, useState } from 'react'
import KeyGate from './components/KeyGate'
import Header from './components/Header'
import OverdueIndicator from './components/OverdueIndicator'
import TodaySection from './components/TodaySection'
import HistorySection from './components/HistorySection'
import { useOverdueCount } from './hooks/useParticipants'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY as string

function isUnlocked(): boolean {
  return localStorage.getItem('lunchapp_key') === MASTER_KEY
}

export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  // overdueKey: bumped on any participant toggle OR new meal → refreshes overdue count
  const [overdueKey, setOverdueKey] = useState(0)
  // mealAddedKey: bumped only when a new meal is created → triggers history refetch
  const [mealAddedKey, setMealAddedKey] = useState(0)
  const historyRef = useRef<HTMLElement>(null)
  const { count: overdueCount, fetch: fetchOverdue } = useOverdueCount()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (unlocked) fetchOverdue()
  }, [unlocked, fetchOverdue, overdueKey])

  function handleParticipantChanged() {
    setOverdueKey(k => k + 1)
  }

  function handleMealAdded() {
    setMealAddedKey(k => k + 1)
    setOverdueKey(k => k + 1)
  }

  function scrollToHistory() {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!unlocked) {
    return <KeyGate onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40">
      <Header />
      <OverdueIndicator count={overdueCount} onScrollToHistory={scrollToHistory} />
      <div className="max-w-xl mx-auto px-4 sm:px-5 pb-16">
        <TodaySection
          today={today}
          onMealAdded={handleMealAdded}
          onParticipantChanged={handleParticipantChanged}
        />
        <div className="border-t border-teal-100/70 my-2" />
        <HistorySection
          ref={historyRef}
          today={today}
          mealAddedKey={mealAddedKey}
        />
      </div>
    </div>
  )
}
