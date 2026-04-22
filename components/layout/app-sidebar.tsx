"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Plus,
  Edit,
  Home,
  Moon,
  Sun,
  Menu,
  Settings,
  Bell,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview & stats",
  },
  {
    title: "Create Sale",
    href: "/sales",
    icon: ShoppingCart,
    description: "New transaction",
  },
  {
    title: "Invoices",
    href: "/bills",
    icon: FileText,
    description: "View all bills",
  },
  {
    title: "Add Stock",
    href: "/stocks/add",
    icon: Plus,
    description: "New inventory",
  },
  {
    title: "Inventory",
    href: "/stocks",
    icon: Package,
    description: "Manage stock",
  },
  {
    title: "Edit Bill",
    href: "/bills/edit/search",
    icon: Edit,
    description: "Modify invoices",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Reports & insights",
  },
]

interface AppSidebarProps {
  children: React.ReactNode
}

export function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed")
    if (savedCollapsed === "true") {
      setCollapsed(true)
    }
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

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

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const SidebarContent = ({ isCollapsed = false, isMobile = false }: { isCollapsed?: boolean; isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 py-5", isCollapsed && !isMobile ? "justify-center px-2" : "px-5")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Package className="h-5 w-5 text-primary-foreground" />
        </div>
        {(!isCollapsed || isMobile) && (
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">StockFlow</h1>
            <p className="text-[11px] font-medium text-muted-foreground">Business Suite</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 py-2", isCollapsed && !isMobile ? "px-2" : "px-3")}>
        {(!isCollapsed || isMobile) && (
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        )}
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={isCollapsed && !isMobile ? item.title : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg text-sm transition-all duration-200",
                isCollapsed && !isMobile ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
              {(!isCollapsed || isMobile) && <span className="font-medium">{item.title}</span>}
              {isActive && (!isCollapsed || isMobile) && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn("border-t py-3", isCollapsed && !isMobile ? "px-2" : "px-3")}>
        <div className={cn("flex items-center", isCollapsed && !isMobile ? "flex-col gap-2" : "gap-2")}>
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Dark mode" : "Light mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>
          <button 
            title="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <button 
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden border-r bg-card md:block transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent isCollapsed={collapsed} />
        {/* Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:bg-secondary hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">StockFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn("transition-all duration-300", collapsed ? "md:pl-16" : "md:pl-60")}>
        {children}
      </main>
    </div>
  )
}
