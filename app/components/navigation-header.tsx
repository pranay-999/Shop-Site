import type React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategorySelector } from "./category-selector"

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
  return (
    <header className={cn("border-b bg-card", className)}>
      <div className="container mx-auto px-4 py-4">
        {/* Category Selector - Top Row */}
        <div className="flex items-center justify-end mb-4">
          <CategorySelector />
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
