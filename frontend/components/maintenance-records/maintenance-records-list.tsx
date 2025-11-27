"use client"

import { useState, useEffect } from "react"
import { api, MaintenanceRecordData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Download, Plus, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MaintenanceRecordsListProps {
  onViewRecord: (id: string) => void
  onCreateRecord: () => void
}

export function MaintenanceRecordsList({ onViewRecord, onCreateRecord }: MaintenanceRecordsListProps) {
  const [records, setRecords] = useState<MaintenanceRecordData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    setError(null)
    const response = await api.getMaintenanceRecords()
    if (response.success) {
      setRecords(response.data)
    } else {
      setError(response.message || "Failed to load maintenance records")
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
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Records</h1>
          <p className="text-black-500 mt-1">Maintenance record management and history</p>
        </div>
        <Button onClick={onCreateRecord} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Record
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Maintenance Records</CardTitle>
          <CardDescription>
            View and manage maintenance records for all transformers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No maintenance records found. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record No.</TableHead>
                    <TableHead>Transformer</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.recordNo}</TableCell>
                      <TableCell>{record.transformerNo}</TableCell>
                      <TableCell>{record.inspectorName || "-"}</TableCell>
                      <TableCell>{getStatusBadge(record.transformerStatus)}</TableCell>
                      <TableCell>{formatDate(record.inspectionTimestamp)}</TableCell>
                      <TableCell>v{record.versionNumber || 1}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
