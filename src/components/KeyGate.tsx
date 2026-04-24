import { useState, type FormEvent } from 'react'
import { Lock, Utensils } from 'lucide-react'

interface Props {
  onUnlock: () => void
}

export default function KeyGate({ onUnlock }: Props) {
  const [key, setKey] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    if (key === import.meta.env.VITE_MASTER_KEY) {
      localStorage.setItem('lunchapp_key', key)
      onUnlock()
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white dark:bg-slate-800 rounded-3xl card-shadow p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-200 dark:shadow-teal-900">
            <Utensils className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-teal-900 dark:text-teal-100 tracking-tight">Lunch Split</h1>
          <p className="text-sm text-teal-600/70 dark:text-teal-400/70 mt-1 font-medium">Chia tiền ăn trưa nhóm</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="access-key" className="block text-xs font-semibold text-teal-800 dark:text-teal-300 mb-2 uppercase tracking-wide">
              Mã truy cập
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
              <input
                id="access-key"
                type="password"
                value={key}
                onChange={e => { setKey(e.target.value); setError(false) }}
                placeholder="Nhập mã truy cập"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-300 dark:placeholder:text-teal-600 bg-teal-50/50 dark:bg-slate-700/50 transition-all duration-200 focus:outline-none focus:bg-white dark:focus:bg-slate-700 ${
                  error
                    ? 'border-red-300 bg-red-50/50 dark:border-red-700 focus:border-red-400'
                    : 'border-teal-100 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-600 focus:border-teal-400 dark:focus:border-teal-500'
                }`}
                autoFocus
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
                Mã không đúng — vui lòng thử lại.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !key}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-orange-200 dark:shadow-orange-900 hover:shadow-orange-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang kiểm tra…
              </>
            ) : 'Vào ứng dụng'}
          </button>
        </form>
      </div>
    </div>
  )
}
