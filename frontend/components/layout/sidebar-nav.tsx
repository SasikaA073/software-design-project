"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, ClipboardList, LayoutDashboard, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: any
  match: (pathname: string) => boolean
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
  { href: "/transformers", label: "Transformers", icon: Zap, match: (p) => p.startsWith("/transformers") },
  { href: "/inspections", label: "Inspections", icon: ClipboardList, match: (p) => p.startsWith("/inspections") },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">Oversight</h1>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Link href={item.href}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-6">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Button>
      </div>
    </div>
  )
}
