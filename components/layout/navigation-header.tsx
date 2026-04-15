'use client'

import type React from "react"
import Link from "next/link"
import { ChevronRight, Home, MoreVertical, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategorySelector } from "./category-selector"
import { useEffect, useState, useRef } from "react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface NavigationHeaderProps {
  items: BreadcrumbItem[]
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function NavigationHeader({ items, title, description, action, className }: NavigationHeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    const current = saved ?? "light"
    setTheme(current)
    if (current === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    setMenuOpen(false)
  }

  return (
    <header className={cn("border-b bg-card", className)}>
      <div className="container mx-auto px-4 py-4">

        {/* Top row: Category on RIGHT, Three-dot on far RIGHT */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <CategorySelector />

          {/* Three-dot settings menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Settings"
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-md border bg-card shadow-lg z-50">
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors rounded-md"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4" />
                      Switch to Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Switch to Light Mode
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5" />
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Title and Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>

      </div>
    </header>
  )
}