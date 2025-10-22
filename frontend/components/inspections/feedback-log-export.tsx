"use client"

import { useState, useEffect } from "react"
import { api, FeedbackLogData, FeedbackLogStats } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileJson, FileSpreadsheet, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * FR3.3: Feedback Log Export Component
 * 
 * Allows users to export feedback logs in JSON or CSV format
 * Displays statistics about feedback logs and model improvement data
 */
export function FeedbackLogExport() {
  const [stats, setStats] = useState<FeedbackLogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await api.getFeedbackLogStats()
      if (response.success) {
        setStats(response.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load feedback log statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "json" | "csv", unusedOnly: boolean) => {
    setExporting(true)
    try {
      if (format === "json") {
        await api.exportFeedbackLogsJSON(unusedOnly)
      } else {
        await api.exportFeedbackLogsCSV(unusedOnly)
      }
      
      toast({
        title: "Export Successful",
        description: `Feedback logs exported as ${format.toUpperCase()}`,
      })
      
      // Reload stats after export
      await loadStats()
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "correction":
        return "bg-blue-500"
      case "addition":
        return "bg-green-500"
      case "deletion":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="mr-2 h-4 w-4" />
          Feedback Logs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>FR3.3: Feedback Log Export</DialogTitle>
          <DialogDescription>
            Export feedback logs for model improvement and training data preparation.
            Logs include AI predictions vs. final user annotations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Options</CardTitle>
              <CardDescription>
                Choose format and scope for feedback log export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Logs</TabsTrigger>
                  <TabsTrigger value="unused">Unused Only</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Export all feedback logs including those already used for training.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleExport("json", false)}
                      disabled={exporting || !stats || stats.totalLogs === 0}
                      className="flex-1"
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Export as JSON
                    </Button>
                    <Button
                      onClick={() => handleExport("csv", false)}
                      disabled={exporting || !stats || stats.totalLogs === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export as CSV
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="unused" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Export only feedback logs not yet used for training (recommended for model updates).
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleExport("json", true)}
                      disabled={exporting || !stats || stats.unusedLogs === 0}
                      className="flex-1"
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Export Unused (JSON)
                    </Button>
                    <Button
                      onClick={() => handleExport("csv", true)}
                      disabled={exporting || !stats || stats.unusedLogs === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Unused (CSV)
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Export Format Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Format Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                <strong>JSON Format:</strong> Structured data suitable for programmatic processing and ML pipelines
              </div>
              <div>
                <strong>CSV Format:</strong> Tabular format for spreadsheet analysis and reporting
              </div>
              <div className="pt-2">
                <strong>Exported fields include:</strong>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                  <li>Image ID and metadata</li>
                  <li>Model-predicted anomalies (AI detections)</li>
                  <li>Final accepted annotations (user corrections)</li>
                  <li>Annotator metadata (ID, name, role, timestamp)</li>
                  <li>Feedback type (correction, addition, deletion)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
