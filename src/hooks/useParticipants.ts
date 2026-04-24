import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOverdueCount() {
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('meal_participants')
      .select('id, meals!inner(date)')
      .eq('is_paid', false)
      .lt('meals.date', today)

    setCount(data?.length ?? 0)
  }, [])

  return { count, fetch }
}
