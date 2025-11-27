"use client"

import { useState, useEffect } from "react"
import { api, MaintenanceRecordData, ThermalImageData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Edit, Download, ArrowLeft, Trash2, Thermometer } from "lucide-react"
import { format } from "date-fns"

interface MaintenanceRecordDetailsProps {
  recordId: string
  onBack: () => void
  onEdit: () => void
}

export function MaintenanceRecordDetails({ recordId, onBack, onEdit }: MaintenanceRecordDetailsProps) {
  const [record, setRecord] = useState<MaintenanceRecordData | null>(null)
  const [thermalImages, setThermalImages] = useState<ThermalImageData[]>([])
  const [baselineImageUrl, setBaselineImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadRecord()
  }, [recordId])

  const loadRecord = async () => {
    setLoading(true)
    const response = await api.getMaintenanceRecordById(recordId)
    if (response.success) {
      setRecord(response.data)
      // Load thermal images for this inspection
      if (response.data.inspectionId) {
        await loadThermalImages(response.data.inspectionId)
        // Load baseline image if transformer available
        if (response.data.transformerId) {
          await loadBaselineImage(response.data.transformerId)
        }
      }
    } else {
      setError(response.message || "Failed to load record")
    }
    setLoading(false)
  }

  const loadThermalImages = async (inspectionId: string) => {
    const response = await api.getThermalImages(inspectionId)
    if (response.success) {
      setThermalImages(response.data)
    }
  }

  const loadBaselineImage = async (transformerId: string) => {
    // Use the weather condition from the record if available, otherwise default to Sunny
    const weatherCondition = record?.thermalImageUrl ? "Sunny" : "Sunny"
    const response = await api.getBaselineImageUrl(transformerId, weatherCondition)
    if (response.success && response.data) {
      setBaselineImageUrl(response.data)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this record?")) return

    setDeleting(true)
    const response = await api.deleteMaintenanceRecord(recordId)
    if (response.success) {
      onBack()
    } else {
      setError(response.message || "Failed to delete record")
      setDeleting(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
    return format(new Date(dateString), "PPP p")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!record) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Record not found"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Maintenance Record</h1>
            <p className="text-gray-500 mt-1">{record.recordNo}</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Print/PDF
          </Button>
          <Button size="sm" onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metadata Section - System Generated */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="text-lg">Transformer & Inspection Details</CardTitle>
          <CardDescription className="print:text-xs">System-generated information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-2 print:text-sm">
          <div>
            <p className="text-sm text-gray-600 print:text-xs">Record Number</p>
            <p className="font-semibold">{record.recordNo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 print:text-xs">Transformer</p>
            <p className="font-semibold">{record.transformerNo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 print:text-xs">Inspection</p>
            <p className="font-semibold">{record.inspectionNo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 print:text-xs">Inspection Date</p>
            <p className="font-semibold">{formatDate(record.inspectionTimestamp)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 print:text-xs">Record Version</p>
            <p className="font-semibold">v{record.versionNumber || 1}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 print:text-xs">Last Modified</p>
            <p className="font-semibold text-xs">{formatDate(record.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Thermal Image Comparison Section */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Thermal Image Analysis
          </CardTitle>
          <CardDescription className="print:text-xs">Baseline vs Maintenance Image Comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 print:space-y-2">
          {thermalImages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 print:text-xs">
              No thermal images available for this inspection
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Compare the baseline reference image with the maintenance inspection image to identify thermal anomalies.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-3">
                {/* Baseline Image Section */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Baseline Image (Reference)</h4>
                  {baselineImageUrl ? (
                    <div className="relative rounded-md overflow-hidden border print:border print:border-gray-300">
                      <img
                        src={baselineImageUrl}
                        alt="Thermal Baseline"
                        className="w-full h-[360px] object-cover print:h-auto print:max-h-96"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[360px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500 print:h-auto">
                      No baseline image available
                    </div>
                  )}
                </div>

                {/* Maintenance Image Section */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Maintenance Image (Current)</h4>
                  {thermalImages.find(img => img.imageType === "Maintenance") ? (
                    <div className="relative rounded-md overflow-hidden border print:border print:border-gray-300">
                      <img
                        src={thermalImages.find(img => img.imageType === "Maintenance")?.imageUrl || ""}
                        alt="Thermal Maintenance"
                        className="w-full h-[360px] object-cover print:h-auto print:max-h-96"
                      />
                      {thermalImages.find(img => img.imageType === "Maintenance")?.anomalyDetected && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          Anomalies Detected
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[360px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500 print:h-auto">
                      No maintenance image available
                    </div>
                  )}
                </div>
              </div>

              {/* Image Details */}
              {thermalImages.length > 0 && (
                <div className="border-t pt-4 print:border-t print:pt-2">
                  <h4 className="font-semibold text-sm mb-3 print:text-xs">Image Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2 print:text-xs">
                    {thermalImages.map((img, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded print:bg-white print:border print:border-gray-200">
                        <p className="font-semibold mb-1 print:text-xs">{img.imageType} Image</p>
                        <div className="space-y-1 text-sm print:text-xs">
                          <p><span className="text-gray-600">Uploaded:</span> {formatDate(img.uploadedAt)}</p>
                          {img.temperatureReading && (
                            <p><span className="text-gray-600">Temperature:</span> {img.temperatureReading}°C</p>
                          )}
                          {img.weatherCondition && (
                            <p><span className="text-gray-600">Weather:</span> {img.weatherCondition}</p>
                          )}
                          {img.anomalyDetected !== undefined && (
                            <p><span className="text-gray-600">Status:</span> {img.anomalyDetected ? "Anomalies Found" : "Normal"}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engineer Assessment Section - Editable Content */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="text-lg">Engineer Assessment</CardTitle>
          <CardDescription className="print:text-xs">Maintenance engineer inputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 print:space-y-3 print:text-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-2">
            <div>
              <p className="text-sm text-gray-600 print:text-xs font-semibold">Inspector Name</p>
              <p className="font-semibold print:font-normal">{record.inspectorName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 print:text-xs font-semibold">Status</p>
              <div className="mt-1">{getStatusBadge(record.transformerStatus)}</div>
            </div>
            {record.actionDueDate && (
              <div>
                <p className="text-sm text-gray-600 print:text-xs font-semibold">Action Due Date</p>
                <p className="font-semibold print:font-normal">{formatDate(record.actionDueDate)}</p>
              </div>
            )}
          </div>

          {/* Electrical Readings */}
          {(record.voltage || record.current || record.frequency || record.loadPercentage) && (
            <div className="border-t pt-4 print:border-t print:pt-2">
              <h4 className="font-semibold mb-3 print:mb-1 print:text-xs">Electrical Readings</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
                {record.voltage !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600 print:text-xs">Voltage</p>
                    <p className="font-semibold print:font-normal">{record.voltage} V</p>
                  </div>
                )}
                {record.current !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600 print:text-xs">Current</p>
                    <p className="font-semibold print:font-normal">{record.current} A</p>
                  </div>
                )}
                {record.frequency !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600 print:text-xs">Frequency</p>
                    <p className="font-semibold print:font-normal">{record.frequency} Hz</p>
                  </div>
                )}
                {record.loadPercentage !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600 print:text-xs">Load</p>
                    <p className="font-semibold print:font-normal">{record.loadPercentage}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Sections */}
          {record.notes && (
            <div className="border-t pt-4 print:border-t print:pt-2">
              <p className="text-sm font-semibold mb-2 print:text-xs print:mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap print:text-xs">{record.notes}</p>
            </div>
          )}

          {record.comments && (
            <div className="border-t pt-4 print:border-t print:pt-2">
              <p className="text-sm font-semibold mb-2 print:text-xs print:mb-1">Comments</p>
              <p className="text-sm whitespace-pre-wrap print:text-xs">{record.comments}</p>
            </div>
          )}

          {record.recommendedAction && (
            <div className="border-t pt-4 print:border-t print:pt-2">
              <p className="text-sm font-semibold mb-2 print:text-xs print:mb-1">Recommended Action</p>
              <p className="text-sm whitespace-pre-wrap print:text-xs">{record.recommendedAction}</p>
            </div>
          )}

          {record.additionalRemarks && (
            <div className="border-t pt-4 print:border-t print:pt-2">
              <p className="text-sm font-semibold mb-2 print:text-xs print:mb-1">Additional Remarks</p>
              <p className="text-sm whitespace-pre-wrap print:text-xs">{record.additionalRemarks}</p>
            </div>
          )}

          <div className="border-t pt-4 print:border-t print:pt-2 text-xs text-gray-600">
            <p>Created: {formatDate(record.createdAt)}</p>
            {record.lastModifiedBy && <p>Last modified by: {record.lastModifiedBy}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Footer for Print */}
      <div className="hidden print:block text-xs text-gray-600 border-t pt-4 mt-8">
        <p>This is an automatically generated maintenance record from the Transformer Management System</p>
        <p>For official use only</p>
      </div>
    </div>
  )
}
