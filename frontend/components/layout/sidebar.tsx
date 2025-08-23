"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Zap, ClipboardList, Settings } from "lucide-react"
import type { ViewType } from "@/components/transformer-dashboard"

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    {
      id: "transformers" as ViewType,
      label: "Transformers",
      icon: Zap,
      active: currentView === "transformers" || currentView === "transformer-details",
    },
    {
      id: "inspections" as ViewType,
      label: "Inspections",
      icon: ClipboardList,
      active: currentView === "inspections" || currentView === "inspection-details",
    },
  ]

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
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={item.active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Button>
          ))}
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
