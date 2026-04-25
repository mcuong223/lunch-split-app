import { useEffect, useState, useCallback } from 'react'
import { fetchUnpaidDebts } from '../lib/supabase'
import type { DebtGroup } from '../types'

export function useDebtSummary(refreshKey: number) {
  const [groups, setGroups] = useState<DebtGroup[] | null>(null)

  const fetch = useCallback(async () => {
    const data = await fetchUnpaidDebts()
    setGroups(data)
  }, [])

  useEffect(() => { fetch() }, [fetch, refreshKey])

  return { groups: groups ?? [], loading: groups === null }
}
