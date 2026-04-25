export interface Meal {
  id: string
  name: string
  date: string
  payer_name: string
  total_amount: number
  created_at: string
}

export interface MealParticipant {
  id: string
  meal_id: string
  name: string
  dish: string | null
  amount_owed: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
}

export interface MealWithParticipants extends Meal {
  meal_participants: MealParticipant[]
}

export interface Member {
  id: string
  name: string
  momo_phone: string | null
  qr_image_url: string | null
  created_at: string
}

export interface Dish {
  id: string
  name: string
  latest_price: number  // full VND, e.g. 35000
  updated_at: string
}

export interface DebtGroup {
  debtor: string
  creditor: string
  total: number  // full VND
  items: Array<{
    participantId: string
    mealName: string
    mealDate: string
    amount: number
  }>
}
