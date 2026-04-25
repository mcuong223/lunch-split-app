import { useState, useRef } from 'react'
import { X, Plus, Upload, Smartphone, QrCode, Trash2, Loader2, Check, Pencil } from 'lucide-react'
import { createMember, updateMember, deleteMember, uploadQrCode } from '../lib/supabase'
import type { Member } from '../types'

interface Props {
  members: Member[]
  onClose: () => void
  onChanged: () => void
}

const inputCls = 'w-full border-2 border-slate-100 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-600 focus:border-teal-400 dark:focus:border-teal-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150 focus:outline-none'

// ─── Add member row ───────────────────────────────────────────────────────────
function AddMemberRow({ onAdded }: { onAdded: (m: Member) => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const m = await createMember(name.trim())
      onAdded(m)
      setName('')
    } catch {
      setError('Tên đã tồn tại hoặc có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Thêm thành viên</p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nhập tên thành viên"
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || !name.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-sm shadow-teal-200 dark:shadow-teal-900"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Thêm
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

// ─── Single member card ───────────────────────────────────────────────────────
function MemberCard({ member, onChanged }: { member: Member; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [momo, setMomo] = useState(member.momo_phone ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [localQrUrl, setLocalQrUrl] = useState(member.qr_image_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    try {
      await updateMember(member.id, { momo_phone: momo.trim() || null })
      onChanged()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadQrCode(member.id, file)
      await updateMember(member.id, { qr_image_url: url })
      setLocalQrUrl(url)
      onChanged()
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete() {
    if (!confirm(`Xoá thành viên "${member.name}"?`)) return
    setDeleting(true)
    try {
      await deleteMember(member.id)
      onChanged()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl card-shadow p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {member.name[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100">{member.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(e => !e)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors cursor-pointer"
              aria-label="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
              aria-label="Xoá"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Info pills when not editing */}
        {!editing && (
          <div className="flex flex-wrap gap-2">
            {member.momo_phone ? (
              <span className="inline-flex items-center gap-1.5 text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-2.5 py-1 rounded-full font-medium">
                <Smartphone className="w-3 h-3" />
                {member.momo_phone}
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Chưa có SĐT MoMo</span>
            )}
            {localQrUrl ? (
              <button
                type="button"
                onClick={() => setShowQr(true)}
                className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <QrCode className="w-3 h-3" />
                Xem QR
              </button>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Chưa có mã QR</span>
            )}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="space-y-3 mt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                SĐT MoMo
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pink-400 pointer-events-none" />
                <input
                  value={momo}
                  onChange={e => setMomo(e.target.value)}
                  placeholder="0912 345 678"
                  className={`${inputCls} pl-9`}
                  inputMode="tel"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Mã QR chuyển khoản
              </label>
              <div className="flex items-center gap-2">
                {localQrUrl && (
                  <button type="button" onClick={() => setShowQr(true)} className="flex-shrink-0 cursor-pointer">
                    <img src={localQrUrl} alt="QR" className="w-14 h-14 object-cover rounded-lg border-2 border-indigo-200 dark:border-indigo-700" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {localQrUrl ? 'Thay ảnh QR' : 'Tải ảnh QR'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrUpload}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setEditing(false); setMomo(member.momo_phone ?? '') }}
                className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium cursor-pointer transition-colors">
                Huỷ
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Lưu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR lightbox */}
      {showQr && localQrUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          onClick={() => setShowQr(false)}
        >
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQr(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 text-center">QR — {member.name}</p>
            <img src={localQrUrl} alt={`QR ${member.name}`} className="w-full rounded-xl" />
            {member.momo_phone && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-pink-600 dark:text-pink-400 font-semibold">
                <Smartphone className="w-4 h-4" />
                {member.momo_phone}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MembersScreen({ members: initialMembers, onClose, onChanged }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)

  function handleAdded(m: Member) {
    setMembers(prev => [...prev, m].sort((a, b) => a.name.localeCompare(b.name)))
    onChanged()
  }

  function handleChanged() {
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-teal-100/60 dark:border-slate-700 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          aria-label="Quay lại"
        >
          <X className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">Quản lý thành viên</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">{members.length} thành viên</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-4 space-y-3">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-teal-500" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Chưa có thành viên</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Thêm thành viên bên dưới</p>
            </div>
          ) : (
            members.map(m => (
              <MemberCard key={m.id} member={m} onChanged={handleChanged} />
            ))
          )}
        </div>
      </div>

      {/* Add member footer */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <AddMemberRow onAdded={handleAdded} />
        </div>
      </div>
    </div>
  )
}
