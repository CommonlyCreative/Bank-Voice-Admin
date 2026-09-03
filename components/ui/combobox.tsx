"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

interface ComboboxProps {
  value: string | null
  onValueChange: (value: string) => void
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [style, setStyle] = React.useState<React.CSSProperties>({})
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const openDropdown = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
    setSearch("")
    setOpen(true)
  }

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const select = (v: string) => {
    onValueChange(v)
    setOpen(false)
  }

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={style}
      className="rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Escape") setOpen(false)
            if (e.key === "Enter" && filtered.length === 1) select(filtered[0].value)
          }}
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <li className="px-2 py-4 text-center text-sm text-muted-foreground">No results.</li>
        ) : (
          filtered.map(o => (
            <li
              key={o.value}
              onMouseDown={e => { e.preventDefault(); select(o.value) }}
              className={cn(
                "relative cursor-pointer flex items-center rounded-md px-2 py-1.5 text-sm select-none hover:bg-accent hover:text-accent-foreground",
                value === o.value && "font-medium"
              )}
            >
              <span className="flex-1">{o.label}</span>
              {value === o.value && <CheckIcon className="ml-2 size-4 shrink-0" />}
            </li>
          ))
        )}
      </ul>
    </div>
  ) : null

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 h-9 text-sm whitespace-nowrap transition-colors outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          !selectedLabel && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {typeof document !== "undefined" && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  )
}
