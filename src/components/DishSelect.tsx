import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import type { Dish } from '../types'

interface Props {
  value: string
  onChange: (name: string) => void
  onDishSelected: (dish: Dish) => void
  dishes: Dish[]
  placeholder?: string
  inputClassName?: string
}

export default function DishSelect({
  value,
  onChange,
  onDishSelected,
  dishes,
  placeholder = 'Món ăn',
  inputClassName = '',
}: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setInputValue(value) }, [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function calcAndOpen() {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      setDropdownStyle({ top: r.bottom + 4, left: r.left, width: r.width, minWidth: 180 })
    }
    setIsOpen(true)
  }

  const filtered = dishes.filter(d =>
    d.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  function handleSelect(dish: Dish) {
    setInputValue(dish.name)
    onChange(dish.name)
    onDishSelected(dish)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            onChange(e.target.value)
            calcAndOpen()
          }}
          onFocus={calcAndOpen}
          placeholder={placeholder}
          className={inputClassName}
        />
        {dishes.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { if (isOpen) { setIsOpen(false) } else { calcAndOpen(); inputRef.current?.focus() } }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(d => (
              <button
                key={d.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(d) }}
                className="w-full px-3 py-2 flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors duration-100 cursor-pointer"
              >
                <span className="truncate text-left">{d.name}</span>
                {d.latest_price > 0 && (
                  <span className="flex-shrink-0 text-xs font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                    {Math.round(d.latest_price / 1000)}k
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
