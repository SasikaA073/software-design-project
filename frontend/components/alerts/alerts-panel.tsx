"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Thermometer, Activity } from "lucide-react"

interface Alert {
  id: string
  type: "temperature" | "maintenance" | "vibration"
  title: string
  message: string
  timestamp: string
  severity: "high" | "medium" | "low"
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "temperature",
    title: "Temperature Threshold Exceeded",
    message: "Transformer AZ-8070 in Nugegoda has exceeded temperature threshold (95°C). Immediate attention required.",
    timestamp: "2025-07-25T04:32:00Z",
    severity: "high",
  },
  {
    id: "2",
    type: "maintenance",
    title: "Maintenance Completed",
    message:
      "Scheduled maintenance for Transformer AZ-5678 in Nugegoda has been completed successfully. All parameters normal.",
    timestamp: "2025-07-25T04:32:00Z",
    severity: "low",
  },
  {
    id: "3",
    type: "vibration",
    title: "Warning: Unusual Vibration Detected",
    message: "Abnormal vibration patterns detected in Transformer AZ-4563. Inspection recommended.",
    timestamp: "2025-07-24T16:20:00Z",
    severity: "medium",
  },
]

export function AlertsPanel({ open }: { open: boolean }) {
  if (!open) return null // only render if open

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="w-4 h-4" />
      case "maintenance":
        return <CheckCircle className="w-4 h-4" />
      case "vibration":
        return <Activity className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="absolute top-16 right-6 w-96 shadow-xl z-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAlerts.map((alert) => (
            <div key={alert.id} className="p-3 border border-border rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <div className="text-muted-foreground mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                    <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>{alert.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatTimestamp(alert.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
