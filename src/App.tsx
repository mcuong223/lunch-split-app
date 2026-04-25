import { useEffect, useRef, useState } from 'react'
import KeyGate from './components/KeyGate'
import Header from './components/Header'
import OverdueIndicator from './components/OverdueIndicator'
import TodaySection from './components/TodaySection'
import HistorySection from './components/HistorySection'
import DebtSummary from './components/DebtSummary'
import MembersScreen from './components/MembersScreen'
import { useOverdueCount } from './hooks/useParticipants'
import { useMembers } from './hooks/useMembers'
import { useDebtSummary } from './hooks/useDebtSummary'
import { useDarkMode } from './hooks/useDarkMode'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY as string

function isUnlocked(): boolean {
  return localStorage.getItem('lunchapp_key') === MASTER_KEY
}

export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [overdueKey, setOverdueKey] = useState(0)
  const [mealAddedKey, setMealAddedKey] = useState(0)
  const [debtKey, setDebtKey] = useState(0)
  const [showMembers, setShowMembers] = useState(false)
  const historyRef = useRef<HTMLElement>(null)

  const { dark, toggle: toggleDark } = useDarkMode()
  const { count: overdueCount, fetch: fetchOverdue } = useOverdueCount()
  const { members, refetch: refetchMembers } = useMembers()
  const { groups: debtGroups, loading: debtLoading } = useDebtSummary(debtKey)

  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  useEffect(() => {
    if (unlocked) fetchOverdue()
  }, [unlocked, fetchOverdue, overdueKey])

  function handleParticipantChanged() {
    setOverdueKey(k => k + 1)
    setDebtKey(k => k + 1)
  }

  function handleMealAdded() {
    setMealAddedKey(k => k + 1)
    setOverdueKey(k => k + 1)
    setDebtKey(k => k + 1)
  }

  function handleDebtSettled() {
    setOverdueKey(k => k + 1)
    setDebtKey(k => k + 1)
    setMealAddedKey(k => k + 1)
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
      <div className="max-w-xl lg:max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="lg:flex lg:gap-8 lg:items-start">

          {/* Main column */}
          <div className="lg:flex-1 min-w-0">
            <TodaySection
              today={today}
              members={members}
              refreshKey={mealAddedKey}
              onMealAdded={handleMealAdded}
              onParticipantChanged={handleParticipantChanged}
              onMemberCreated={refetchMembers}
            />
            <div className="border-t border-teal-100/70 dark:border-slate-700/70 my-2" />
            {/* Debt summary inline — mobile only */}
            <div className="lg:hidden">
              <DebtSummary
                groups={debtGroups}
                loading={debtLoading}
                onSettled={handleDebtSettled}
              />
            </div>
            <HistorySection
              ref={historyRef}
              today={today}
              members={members}
              mealAddedKey={mealAddedKey}
              onParticipantChanged={handleParticipantChanged}
            />
          </div>

          {/* Sticky sidebar — desktop only */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-20 pt-4">
            <DebtSummary
              groups={debtGroups}
              loading={debtLoading}
              onSettled={handleDebtSettled}
            />
          </aside>

        </div>
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
