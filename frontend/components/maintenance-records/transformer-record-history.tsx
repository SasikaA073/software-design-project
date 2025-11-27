"use client"

import { useState, useEffect } from "react"
import { api, MaintenanceRecordData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, ArrowLeft, Eye } from "lucide-react"
import { format } from "date-fns"

interface TransformerRecordHistoryProps {
  transformerId: string
  onViewRecord: (id: string) => void
  onBack: () => void
}

export function TransformerRecordHistory({
  transformerId,
  onViewRecord,
  onBack,
}: TransformerRecordHistoryProps) {
  const [records, setRecords] = useState<MaintenanceRecordData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecordHistory()
  }, [transformerId])

  const loadRecordHistory = async () => {
    setLoading(true)
    setError(null)
    const response = await api.getTransformerRecordHistory(transformerId)
    if (response.success) {
      setRecords(response.data)
    } else {
      setError(response.message || "Failed to load record history")
    }
    setLoading(false)
  }

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      OK: { label: "OK", variant: "default" },
      NEEDS_MAINTENANCE: { label: "Needs Maintenance", variant: "secondary" },
      URGENT_ATTENTION: { label: "Urgent Attention", variant: "destructive" },
    }
    const config = statusMap[status || ""] || { label: status || "Unknown", variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "PPP")
  }

  const groupByInspection = () => {
    const grouped: Record<string, MaintenanceRecordData[]> = {}
    records.forEach((record) => {
      const inspectionKey = record.inspectionNo || "unknown"
      if (!grouped[inspectionKey]) {
        grouped[inspectionKey] = []
      }
      grouped[inspectionKey].push(record)
    })
    return grouped
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Maintenance Record History</h1>
          <p className="text-gray-500 mt-1">FR4.3: View all past maintenance records with version history</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">No maintenance records found for this transformer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupByInspection()).map(([inspectionNo, inspectionRecords]) => (
            <Card key={inspectionNo}>
              <CardHeader>
                <CardTitle className="text-lg">Inspection: {inspectionNo}</CardTitle>
                <CardDescription>
                  {inspectionRecords[0]?.inspectionTimestamp
                    ? formatDate(inspectionRecords[0].inspectionTimestamp)
                    : "Date unknown"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Record No.</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectionRecords
                        .sort((a, b) => {
                          // Sort by created date descending, then by version descending
                          const dateCompare =
                            new Date(b.createdAt || 0).getTime() -
                            new Date(a.createdAt || 0).getTime()
                          if (dateCompare !== 0) return dateCompare
                          return (b.versionNumber || 0) - (a.versionNumber || 0)
                        })
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.recordNo}</TableCell>
                            <TableCell>v{record.versionNumber || 1}</TableCell>
                            <TableCell>{record.inspectorName || "-"}</TableCell>
                            <TableCell>{getStatusBadge(record.transformerStatus)}</TableCell>
                            <TableCell className="text-xs">
                              {formatDate(record.createdAt)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatDate(record.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => record.id && onViewRecord(record.id)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary Statistics */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">History Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Inspections</p>
                <p className="text-2xl font-bold">{Object.keys(groupByInspection()).length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Latest Record</p>
                <p className="text-sm">
                  {records.length > 0
                    ? formatDate(
                        records.reduce((latest, current) =>
                          new Date(current.createdAt || 0) > new Date(latest.createdAt || 0)
                            ? current
                            : latest
                        ).createdAt
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Distribution</p>
                <div className="flex gap-1 mt-1">
                  {["OK", "NEEDS_MAINTENANCE", "URGENT_ATTENTION"].map((status) => {
                    const count = records.filter((r) => r.transformerStatus === status).length
                    return count > 0 ? (
                      <Badge key={status} variant="secondary" className="text-xs">
                        {status}: {count}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
