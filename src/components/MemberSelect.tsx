import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Check, Loader2 } from 'lucide-react'
import { createMember } from '../lib/supabase'
import type { Member } from '../types'

interface Props {
  value: string
  onChange: (name: string) => void
  members: Member[]
  onMemberCreated: (member: Member) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export default function MemberSelect({
  value,
  onChange,
  members,
  onMemberCreated,
  placeholder = 'Chọn hoặc nhập tên',
  className = '',
  inputClassName = '',
}: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setInputValue(value) }, [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(inputValue.toLowerCase())
  )
  const hasExactMatch = members.some(
    m => m.name.toLowerCase() === inputValue.trim().toLowerCase()
  )
  const canCreate = inputValue.trim().length > 0 && !hasExactMatch

  async function handleCreate() {
    if (!inputValue.trim() || creating) return
    setCreating(true)
    try {
      const member = await createMember(inputValue.trim())
      onMemberCreated(member)
      onChange(member.name)
      setInputValue(member.name)
      setIsOpen(false)
    } catch {
      // name conflict — just close
      setIsOpen(false)
    } finally {
      setCreating(false)
    }
  }

  function handleSelect(member: Member) {
    onChange(member.name)
    setInputValue(member.name)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={inputClassName}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setIsOpen(o => !o); inputRef.current?.focus() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[160px] bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(m) }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2 transition-colors duration-100 cursor-pointer"
              >
                {value === m.name && <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />}
                {value !== m.name && <span className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{m.name}</span>
              </button>
            ))}
          </div>

          {canCreate && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); handleCreate() }}
              disabled={creating}
              className="w-full px-3 py-2 text-left text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 transition-colors duration-100 cursor-pointer"
            >
              {creating
                ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                : <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              }
              <span>Tạo "<span className="font-semibold">{inputValue.trim()}</span>"</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
