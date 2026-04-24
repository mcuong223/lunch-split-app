import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { MealWithParticipants } from '../types'

// null = never loaded yet (show skeleton); array = loaded (even if empty)
export function useMeals(date: string) {
  const [meals, setMeals] = useState<MealWithParticipants[] | null>(null)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('meals')
      .select('*, meal_participants(*)')
      .eq('date', date)
      .order('created_at', { ascending: true })
    setMeals((data as MealWithParticipants[]) ?? [])
  }, [date])

  useEffect(() => { fetch() }, [fetch])

  return { meals: meals ?? [], loading: meals === null, refetch: fetch }
}

// null = never loaded yet; object = loaded
export function useAllMeals() {
  const [mealsByDate, setMealsByDate] = useState<Record<string, MealWithParticipants[]> | null>(null)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('meals')
      .select('*, meal_participants(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: true })

    const grouped: Record<string, MealWithParticipants[]> = {}
    for (const meal of (data as MealWithParticipants[]) ?? []) {
      if (!grouped[meal.date]) grouped[meal.date] = []
      grouped[meal.date].push(meal)
    }
    setMealsByDate(grouped)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { mealsByDate: mealsByDate ?? {}, loading: mealsByDate === null, refetch: fetch }
}
