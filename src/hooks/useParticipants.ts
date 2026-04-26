import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOverdueCount() {
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('meal_participants')
      .select('id, name, meals!inner(date, payer_name)')
      .eq('is_paid', false)
      .lt('meals.date', today)

    const rows = (data ?? []) as unknown as { id: string; name: string; meals: { payer_name: string } }[]
    setCount(rows.filter(r => r.name !== r.meals.payer_name).length)
  }, [])

  return { count, fetch }
}
