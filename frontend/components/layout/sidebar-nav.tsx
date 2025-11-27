"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, ClipboardList, LayoutDashboard, Settings, FileText, ChevronLeft, Menu } from "lucide-react"
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
  { href: "/maintenance-records", label: "Maintenance Records", icon: FileText, match: (p) => p.startsWith("/maintenance-records") },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {isOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">Oversight</h1>
              </div>
            )}
            {!isOpen && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0"
              onClick={() => setIsOpen(!isOpen)}
              title={isOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
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
                    "w-full justify-start gap-3 h-11 flex-shrink-0",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    !isOpen && "justify-center"
                  )}
                  title={!isOpen ? item.label : ""}
                >
                  <Link href={item.href} className="flex items-center gap-3 w-full">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? "Settings" : ""}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="whitespace-nowrap">Settings</span>}
          </Button>
        </div>
      </div>
    </>
  )
}
