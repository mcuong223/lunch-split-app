import { useEffect, useRef, useState } from 'react'
import KeyGate from './components/KeyGate'
import Header from './components/Header'
import OverdueIndicator from './components/OverdueIndicator'
import TodaySection from './components/TodaySection'
import HistorySection from './components/HistorySection'
import MembersScreen from './components/MembersScreen'
import { useOverdueCount } from './hooks/useParticipants'
import { useMembers } from './hooks/useMembers'
import { useDarkMode } from './hooks/useDarkMode'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY as string

function isUnlocked(): boolean {
  return localStorage.getItem('lunchapp_key') === MASTER_KEY
}

export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [overdueKey, setOverdueKey] = useState(0)
  const [mealAddedKey, setMealAddedKey] = useState(0)
  const [showMembers, setShowMembers] = useState(false)
  const historyRef = useRef<HTMLElement>(null)

  const { dark, toggle: toggleDark } = useDarkMode()
  const { count: overdueCount, fetch: fetchOverdue } = useOverdueCount()
  const { members, refetch: refetchMembers } = useMembers()

  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <Header dark={dark} onToggleDark={toggleDark} onOpenMembers={() => setShowMembers(true)} />
      <OverdueIndicator count={overdueCount} onScrollToHistory={scrollToHistory} />
      <div className="max-w-xl mx-auto px-4 sm:px-5 pb-16">
        <TodaySection
          today={today}
          members={members}
          onMealAdded={handleMealAdded}
          onParticipantChanged={handleParticipantChanged}
          onMemberCreated={refetchMembers}
        />
        <div className="border-t border-teal-100/70 dark:border-slate-700/70 my-2" />
        <HistorySection
          ref={historyRef}
          today={today}
          members={members}
          mealAddedKey={mealAddedKey}
        />
      </div>

      {showMembers && (
        <MembersScreen
          members={members}
          onClose={() => setShowMembers(false)}
          onChanged={refetchMembers}
        />
      )}
    </div>
  )
}
