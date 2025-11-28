"use client"

import { useState, useEffect, useMemo } from "react"
import { api, MaintenanceRecordData, ThermalImageData, Detection, AnomalyDetail } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Edit, Download, ArrowLeft, Trash2, Thermometer, Bot, User, UserPen } from "lucide-react"
import { ThermalImageCanvas } from "@/components/inspections/thermal-image-canvas"
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
  const [detections, setDetections] = useState<Detection[]>([])

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
      // Parse detections from maintenance image
      const maintenanceImage = response.data.find(img => img.imageType === "Maintenance")
      if (maintenanceImage?.detectionData) {
        try {
          const parsedDetections = JSON.parse(maintenanceImage.detectionData)
          setDetections(Array.isArray(parsedDetections) ? parsedDetections : [])
        } catch (e) {
          console.error("Failed to parse detection data:", e)
          setDetections([])
        }
      } else {
        setDetections([])
      }
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
    if (!record) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups for printing")
      return
    }

    // Build HTML for print - print complete page content
    const getSourceBadge = (annotationType: string) => {
      if (annotationType === "ai_detected") return `<span style="padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">🤖 AI Detected</span>`
      if (annotationType === "user_added") return `<span style="padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #dcfce7; color: #166534; border: 1px solid #86efac;">👤 User Added</span>`
      if (annotationType === "user_edited") return `<span style="padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #fef3c7; color: #92400e; border: 1px solid #fbbf24;">✏️ User Edited</span>`
      return ""
    }
    
    const detectionsHTML = record.anomalyDetails && record.anomalyDetails.length > 0 
      ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;"><div style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">Detected Anomalies (${record.anomalyDetails.length})</div>${record.anomalyDetails.map((anomaly) => `<div style="padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; margin-bottom: 10px;"><div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;"><span style="display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;">${anomaly.detectionClass}</span><span style="font-size: 11px; font-weight: 600; color: #666;">Confidence: ${(anomaly.confidence * 100).toFixed(1)}%</span>${getSourceBadge(anomaly.annotationType)}</div><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; font-size: 11px;"><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">X:</span> ${Math.round(anomaly.x)}px</div><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">Y:</span> ${Math.round(anomaly.y)}px</div><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">Width:</span> ${Math.round(anomaly.width)}px</div><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">Height:</span> ${Math.round(anomaly.height)}px</div></div>${anomaly.comments ? `<div style="font-size: 12px; color: #333; margin-top: 8px; padding-top: 8px; border-top: 1px solid #bfdbfe;">${anomaly.comments}</div>` : ''}<div style="font-size: 10px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #bfdbfe;">Created by: ${anomaly.createdBy}${anomaly.modifiedBy && anomaly.modifiedBy !== anomaly.createdBy ? ` | Modified by: ${anomaly.modifiedBy}` : ''}</div></div>`).join('')}</div>`
      : detections.length > 0 
        ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;"><div style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">Detected Anomalies (${detections.length})</div>${detections.map((detection) => `<div style="padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; margin-bottom: 10px;"><div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;"><span style="display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;">${detection.class}</span><span style="font-size: 11px; font-weight: 600; color: #666;">Confidence: ${(detection.confidence * 100).toFixed(1)}%</span></div><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; font-size: 11px;"><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">X:</span> ${Math.round(detection.x)}px</div><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">Y:</span> ${Math.round(detection.y)}px</div><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">Width:</span> ${Math.round(detection.width)}px</div><div style="padding: 6px; background: white; border: 1px solid #bfdbfe; border-radius: 4px;"><span style="color: #666; font-weight: 500;">Height:</span> ${Math.round(detection.height)}px</div></div>${detection.comments ? `<div style="font-size: 12px; color: #333; margin-top: 8px; padding-top: 8px; border-top: 1px solid #bfdbfe;">${detection.comments}</div>` : ''}</div>`).join('')}</div>`
        : ""

    const imageDetailsHTML = thermalImages.length > 0 ? `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">${thermalImages.map((img) => `<div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px;"><div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${img.imageType} Image</div><div style="margin-bottom: 5px; color: #374151;"><span style="color: #666;">Uploaded:</span> ${formatDate(img.uploadedAt)}</div>${img.temperatureReading ? `<div style="margin-bottom: 5px; color: #374151;"><span style="color: #666;">Temperature:</span> ${img.temperatureReading}°C</div>` : ""}${img.weatherCondition ? `<div style="margin-bottom: 5px; color: #374151;"><span style="color: #666;">Weather:</span> ${img.weatherCondition}</div>` : ""}${img.anomalyDetected !== undefined ? `<div style="margin-bottom: 5px; color: #374151;"><span style="color: #666;">Status:</span> ${img.anomalyDetected ? "Anomalies Found" : "Normal"}</div>` : ""}</div>`).join("")}</div>` : ""

    const printHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Maintenance Record - ${record.recordNo}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; color: #000; line-height: 1.5; padding: 20px; }
.container { max-width: 900px; margin: 0 auto; }
h1 { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
.record-number { color: #666; font-size: 14px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
.card-header { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f3f4f6; }
.card-title { font-size: 18px; font-weight: 600; margin-bottom: 5px; }
.card-description { font-size: 12px; color: #666; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 15px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.field-label { font-size: 12px; color: #666; margin-bottom: 5px; font-weight: 500; }
.field-value { font-size: 14px; font-weight: 600; }
.image-wrapper { border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; background: #f9fafb; height: 400px; display: flex; align-items: center; justify-content: center; }
.image-wrapper img { width: 100%; height: 100%; object-fit: contain; }
.image-title { font-weight: 600; font-size: 14px; margin-bottom: 10px; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.badge-default { background: #f3f4f6; color: #111; border: 1px solid #d1d5db; }
.badge-secondary { background: #fef3c7; color: #92400e; border: 1px solid #fbbf24; }
.badge-destructive { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 11px; color: #666; }
@media print {
  * { margin: 0; padding: 0; }
  body { padding: 0; margin: 0; }
  .card { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="container">
<h1>Maintenance Record</h1>
<div class="record-number">${record.recordNo}</div>

<div class="card">
<div class="card-header">
<div class="card-title">Transformer & Inspection Details</div>
<div class="card-description">System-generated information</div>
</div>
<div class="grid">
<div><div class="field-label">Record Number</div><div class="field-value">${record.recordNo}</div></div>
<div><div class="field-label">Transformer</div><div class="field-value">${record.transformerNo}</div></div>
<div><div class="field-label">Inspection</div><div class="field-value">${record.inspectionNo}</div></div>
<div><div class="field-label">Inspection Date</div><div class="field-value">${formatDate(record.inspectionTimestamp)}</div></div>
<div><div class="field-label">Record Version</div><div class="field-value">v${record.versionNumber || 1}</div></div>
<div><div class="field-label">Last Modified</div><div class="field-value">${formatDate(record.updatedAt)}</div></div>
</div>
</div>

<div class="card">
<div class="card-header">
<div class="card-title">Thermal Image Analysis</div>
<div class="card-description">Baseline vs Maintenance Image Comparison</div>
</div>
${thermalImages.length === 0 ? '<div style="text-align: center; color: #999; padding: 20px;">No thermal images available</div>' : `<div class="grid-2"><div><div class="image-title">Baseline Image (Reference)</div><div class="image-wrapper">${baselineImageUrl ? `<img src="${baselineImageUrl}" alt="Baseline">` : '<div style="color: #999;">No baseline image</div>'}</div></div><div><div class="image-title">Maintenance Image (Current)</div><div class="image-wrapper">${thermalImages.find((img) => img.imageType === "Maintenance") ? `<img src="${thermalImages.find((img) => img.imageType === "Maintenance")?.imageUrl || ''}" alt="Maintenance">` : '<div style="color: #999;">No maintenance image</div>'}</div></div></div>${imageDetailsHTML}${detectionsHTML}`}
</div>

<div class="card">
<div class="card-header">
<div class="card-title">Engineer Assessment</div>
<div class="card-description">Maintenance engineer inputs</div>
</div>
<div class="grid">
<div><div class="field-label">Inspector Name</div><div class="field-value">${record.inspectorName || "-"}</div></div>
<div><div class="field-label">Status</div><div style="margin-top: 5px;"><span class="badge badge-${getStatusBadgeType(record.transformerStatus)}">${getStatusLabel(record.transformerStatus)}</span></div></div>
${record.actionDueDate ? `<div><div class="field-label">Action Due Date</div><div class="field-value">${formatDate(record.actionDueDate)}</div></div>` : ""}
</div>

${(record.voltage || record.current || record.frequency || record.loadPercentage) ? `<div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;"><div style="font-weight: 600; margin-bottom: 10px;">Electrical Readings</div><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">${record.voltage !== undefined ? `<div><div class="field-label">Voltage</div><div class="field-value">${record.voltage} V</div></div>` : ""}${record.current !== undefined ? `<div><div class="field-label">Current</div><div class="field-value">${record.current} A</div></div>` : ""}${record.frequency !== undefined ? `<div><div class="field-label">Frequency</div><div class="field-value">${record.frequency} Hz</div></div>` : ""}${record.loadPercentage !== undefined ? `<div><div class="field-label">Load</div><div class="field-value">${record.loadPercentage}%</div></div>` : ""}</div></div>` : ""}

${record.notes ? `<div style="margin: 15px 0; border-top: 1px solid #e5e7eb; padding-top: 15px;"><div style="font-weight: 600; margin-bottom: 10px;">Notes</div><div style="white-space: pre-wrap; background: #f9fafb; padding: 10px; border-radius: 4px; border-left: 3px solid #3b82f6;">${record.notes}</div></div>` : ""}
${record.comments ? `<div style="margin: 15px 0; border-top: 1px solid #e5e7eb; padding-top: 15px;"><div style="font-weight: 600; margin-bottom: 10px;">Comments</div><div style="white-space: pre-wrap; background: #f9fafb; padding: 10px; border-radius: 4px; border-left: 3px solid #3b82f6;">${record.comments}</div></div>` : ""}
${record.recommendedAction ? `<div style="margin: 15px 0; border-top: 1px solid #e5e7eb; padding-top: 15px;"><div style="font-weight: 600; margin-bottom: 10px;">Recommended Action</div><div style="white-space: pre-wrap; background: #f9fafb; padding: 10px; border-radius: 4px; border-left: 3px solid #3b82f6;">${record.recommendedAction}</div></div>` : ""}
${record.additionalRemarks ? `<div style="margin: 15px 0; border-top: 1px solid #e5e7eb; padding-top: 15px;"><div style="font-weight: 600; margin-bottom: 10px;">Additional Remarks</div><div style="white-space: pre-wrap; background: #f9fafb; padding: 10px; border-radius: 4px; border-left: 3px solid #3b82f6;">${record.additionalRemarks}</div></div>` : ""}

<div style="font-size: 11px; color: #666; margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
<div>Created: ${formatDate(record.createdAt)}</div>
${record.lastModifiedBy ? `<div>Last modified by: ${record.lastModifiedBy}</div>` : ""}
</div>
</div>

<div class="footer">
<p>This is an automatically generated maintenance record from the Transformer Management System</p>
<p>For official use only</p>
<p>Generated on: ${new Date().toLocaleString()}</p>
</div>
</div>
</body>
</html>`

    printWindow.document.write(printHTML)
    printWindow.document.close()
    
    // Wait for images to load then print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case "OK":
        return "OK"
      case "NEEDS_MAINTENANCE":
        return "Needs Maintenance"
      case "URGENT_ATTENTION":
        return "Urgent Attention"
      default:
        return "Unknown"
    }
  }

  const getStatusBadgeType = (status?: string): string => {
    switch (status) {
      case "OK":
        return "default"
      case "NEEDS_MAINTENANCE":
        return "secondary"
      case "URGENT_ATTENTION":
        return "destructive"
      default:
        return "outline"
    }
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

  const getAnomalyTypeVariant = (anomalyClass?: string): any => {
    const variantMap: Record<string, string> = {
      faulty: "destructive",
      potentially_faulty: "secondary",
      normal: "default",
      default: "outline",
    }
    return variantMap[anomalyClass?.toLowerCase() || ""] || "outline"
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

                {/* Maintenance Image Section with Anomaly Bounding Boxes */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Maintenance Image (Current)</h4>
                  {thermalImages.find(img => img.imageType === "Maintenance") ? (
                    <div className="relative rounded-md overflow-hidden border print:border print:border-gray-300">
                      <ThermalImageCanvas
                        imageUrl={thermalImages.find(img => img.imageType === "Maintenance")?.imageUrl || ""}
                        detections={detections}
                        alt="Thermal Maintenance"
                        className="w-full h-[360px]"
                      />
                      {thermalImages.find(img => img.imageType === "Maintenance")?.anomalyDetected && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold z-10">
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

              {/* Detected Anomalies Section with Source Tracking */}
              {record.anomalyDetails && record.anomalyDetails.length > 0 && (
                <div className="border-t pt-4 print:border-t print:pt-2">
                  <h4 className="font-semibold text-sm mb-3 print:text-xs">Detected Anomalies ({record.anomalyDetails.length})</h4>
                  <div className="space-y-2">
                    {record.anomalyDetails.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className="p-3 bg-blue-50 border border-blue-200 rounded print:bg-white print:border print:border-gray-300"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getAnomalyTypeVariant(anomaly.detectionClass)}>
                              {anomaly.detectionClass}
                            </Badge>
                            <span className="text-xs font-semibold text-gray-600">
                              Confidence: {(anomaly.confidence * 100).toFixed(1)}%
                            </span>
                            {/* Source Badge */}
                            {anomaly.annotationType === "ai_detected" && (
                              <Badge variant="outline" className="gap-1">
                                <Bot className="h-3 w-3" />
                                AI Detected
                              </Badge>
                            )}
                            {anomaly.annotationType === "user_added" && (
                              <Badge variant="outline" className="gap-1 bg-green-50 border-green-300 text-green-700">
                                <User className="h-3 w-3" />
                                User Added
                              </Badge>
                            )}
                            {anomaly.annotationType === "user_edited" && (
                              <Badge variant="outline" className="gap-1 bg-amber-50 border-amber-300 text-amber-700">
                                <UserPen className="h-3 w-3" />
                                User Edited
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs print:text-xs">
                          <div>
                            <span className="text-gray-600">X:</span> {Math.round(anomaly.x)}px
                          </div>
                          <div>
                            <span className="text-gray-600">Y:</span> {Math.round(anomaly.y)}px
                          </div>
                          <div>
                            <span className="text-gray-600">Width:</span> {Math.round(anomaly.width)}px
                          </div>
                          <div>
                            <span className="text-gray-600">Height:</span> {Math.round(anomaly.height)}px
                          </div>
                        </div>
                        {anomaly.comments && (
                          <p className="text-xs text-gray-700 mt-2 print:text-xs">{anomaly.comments}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          <span>Created by: {anomaly.createdBy}</span>
                          {anomaly.modifiedBy && anomaly.modifiedBy !== anomaly.createdBy && (
                            <span className="ml-3">Modified by: {anomaly.modifiedBy}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Legacy Detections Fallback (for backward compatibility) */}
              {(!record.anomalyDetails || record.anomalyDetails.length === 0) && detections.length > 0 && (
                <div className="border-t pt-4 print:border-t print:pt-2">
                  <h4 className="font-semibold text-sm mb-3 print:text-xs">Detected Anomalies ({detections.length})</h4>
                  <div className="space-y-2">
                    {detections.map((detection, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-blue-50 border border-blue-200 rounded print:bg-white print:border print:border-gray-300"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getAnomalyTypeVariant(detection.class)}>
                              {detection.class}
                            </Badge>
                            <span className="text-xs font-semibold text-gray-600">
                              Confidence: {(detection.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs print:text-xs">
                          <div>
                            <span className="text-gray-600">X:</span> {Math.round(detection.x)}px
                          </div>
                          <div>
                            <span className="text-gray-600">Y:</span> {Math.round(detection.y)}px
                          </div>
                          <div>
                            <span className="text-gray-600">Width:</span> {Math.round(detection.width)}px
                          </div>
                          <div>
                            <span className="text-gray-600">Height:</span> {Math.round(detection.height)}px
                          </div>
                        </div>
                        {detection.comments && (
                          <p className="text-xs text-gray-700 mt-2 print:text-xs">{detection.comments}</p>
                        )}
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
