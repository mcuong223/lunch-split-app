import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Member } from '../types'

export function useMembers() {
  const [members, setMembers] = useState<Member[] | null>(null)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true })
    setMembers((data as Member[]) ?? [])
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { members: members ?? [], loading: members === null, refetch: fetch }
}
