import { useEffect, useState, useCallback } from 'react'
import { fetchDishes } from '../lib/supabase'
import type { Dish } from '../types'

export function useDishes() {
  const [dishes, setDishes] = useState<Dish[] | null>(null)

  const fetch = useCallback(async () => {
    const data = await fetchDishes()
    setDishes(data)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { dishes: dishes ?? [], loading: dishes === null }
}
