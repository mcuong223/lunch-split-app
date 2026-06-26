import { createClient } from '@supabase/supabase-js'
import type { Member, Dish, DebtGroup } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Meals ────────────────────────────────────────────────────────────────────

export async function generateMealName(date: string): Promise<string> {
  const { count } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .eq('date', date)

  const [year, month, day] = date.split('-')
  const label = `${day}/${month}/${year}`
  if (!count || count === 0) return label
  return `${label} - ${String(count + 1).padStart(2, '0')}`
}

export async function deleteMeal(mealId: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', mealId)
  if (error) throw error
}

export async function markPaid(participantId: string) {
  const { error } = await supabase
    .from('meal_participants')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('id', participantId)
  if (error) throw error
}

export async function markUnpaid(participantId: string) {
  const { error } = await supabase
    .from('meal_participants')
    .update({ is_paid: false, paid_at: null })
    .eq('id', participantId)
  if (error) throw error
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function createMember(name: string): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) throw error
  return data as Member
}

export async function updateMember(
  id: string,
  updates: Partial<Pick<Member, 'name' | 'momo_phone' | 'qr_image_url'>>
): Promise<void> {
  const { error } = await supabase.from('members').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}

// ─── Dishes ───────────────────────────────────────────────────────────────────

export async function fetchDishes(): Promise<Dish[]> {
  const { data } = await supabase.from('dishes').select('*').order('name')
  return (data as Dish[]) ?? []
}

export async function upsertDishPrice(
  entries: Array<{ name: string; latest_price: number }>
): Promise<void> {
  if (entries.length === 0) return
  const { error } = await supabase
    .from('dishes')
    .upsert(entries, { onConflict: 'name' })
  if (error) throw error
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export async function fetchUnpaidDebts(): Promise<DebtGroup[]> {
  const { data, error } = await supabase
    .from('meal_participants')
    .select('id, name, amount_owed, meals!inner(id, name, date, payer_name)')
    .eq('is_paid', false)
    .gt('amount_owed', 0)
  if (error) throw error

  const map = new Map<string, DebtGroup>()
  for (const row of (data ?? []) as any[]) {
    const debtor: string = row.name
    const creditor: string = row.meals.payer_name
    if (debtor === creditor) continue
    const key = `${debtor}||${creditor}`
    if (!map.has(key)) map.set(key, { debtor, creditor, total: 0, items: [] })
    const g = map.get(key)!
    g.total += row.amount_owed
    g.items.push({
      participantId: row.id,
      mealName: row.meals.name,
      mealDate: row.meals.date,
      amount: row.amount_owed,
    })
  }
  return Array.from(map.values())
}

export async function markPaidBulk(participantIds: string[]): Promise<void> {
  if (participantIds.length === 0) return
  const { error } = await supabase
    .from('meal_participants')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .in('id', participantIds)
  if (error) throw error
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function uploadQrCode(memberId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${memberId}.${ext}`
  const { error } = await supabase.storage
    .from('qr-codes')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('qr-codes').getPublicUrl(path)
  // Cache-bust so updated QR shows immediately
  return `${data.publicUrl}?t=${Date.now()}`
}
