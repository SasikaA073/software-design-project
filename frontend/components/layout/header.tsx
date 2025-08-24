"use client"

import { useState } from "react"
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AlertsPanel } from "@/components/alerts/alerts-panel"  // ⬅️ import alerts panel

export function Header() {
  const [alertsOpen, setAlertsOpen] = useState(false)

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between relative">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search transformers..." className="pl-10 w-80" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 🔔 Bell icon toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setAlertsOpen(!alertsOpen)}
        >
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-accent">
            3
          </Badge>
        </Button>

        {/* 👤 User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">Olivera Queen</div>
                <div className="text-xs text-muted-foreground">olivera@gmail.com</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 🔽 Alerts Panel (dropdown under bell) */}
      <AlertsPanel open={alertsOpen} />
    </header>
  )
}
