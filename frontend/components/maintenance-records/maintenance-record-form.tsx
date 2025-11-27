"use client"

import { useState, useEffect } from "react"
import { api, MaintenanceRecordData, InspectionData, TransformerData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Save, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface MaintenanceRecordFormProps {
  recordId?: string
  onSuccess?: () => void
}

export function MaintenanceRecordForm({ recordId, onSuccess }: MaintenanceRecordFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!recordId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transformers, setTransformers] = useState<TransformerData[]>([])
  const [inspections, setInspections] = useState<InspectionData[]>([])
  const [selectedTransformer, setSelectedTransformer] = useState<string>("")
  const [selectedInspection, setSelectedInspection] = useState<string>("")

  const [formData, setFormData] = useState<Partial<MaintenanceRecordData>>({
    transformerStatus: "OK",
    voltage: 0,
    current: 0,
    frequency: 50,
    loadPercentage: 0,
  })

  useEffect(() => {
    loadTransformers()
    if (recordId) {
      loadRecord()
    }
  }, [recordId])

  useEffect(() => {
    if (selectedTransformer) {
      loadInspections(selectedTransformer)
    }
  }, [selectedTransformer])

  const loadTransformers = async () => {
    const response = await api.getTransformers()
    if (response.success) {
      setTransformers(response.data)
    }
  }

  const loadInspections = async (transformerId: string) => {
    const response = await api.getInspections(transformerId)
    if (response.success) {
      setInspections(response.data)
    }
  }

  const loadRecord = async () => {
    if (!recordId) return
    const response = await api.getMaintenanceRecordById(recordId)
    if (response.success) {
      setFormData(response.data)
      setSelectedTransformer(response.data.transformerId)
      setSelectedInspection(response.data.inspectionId)
    } else {
      setError(response.message || "Failed to load record")
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!selectedTransformer || !selectedInspection) {
        setError("Please select both transformer and inspection")
        setSaving(false)
        return
      }

      const payload: MaintenanceRecordData = {
        ...formData,
        transformerId: selectedTransformer,
        inspectionId: selectedInspection,
      }

      let response
      if (recordId) {
        response = await api.updateMaintenanceRecord(recordId, payload)
      } else {
        response = await api.createMaintenanceRecord(payload)
      }

      if (response.success) {
        onSuccess?.()
      } else {
        setError(response.message || "Failed to save record")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {recordId ? "Edit Maintenance Record" : "Create Maintenance Record"}
          </h1>
          <p className="text-gray-500 mt-1">FR4: Generate and manage maintenance records</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FR4.1: Transformer Metadata Section */}
        <Card>
          <CardHeader>
            <CardTitle>Transformer & Inspection Information</CardTitle>
            <CardDescription>System-generated content from Phase 3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transformer">Transformer *</Label>
                <Select value={selectedTransformer} onValueChange={setSelectedTransformer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transformer" />
                  </SelectTrigger>
                  <SelectContent>
                    {transformers.map((t) => (
                      <SelectItem key={t.id} value={t.id || ""}>
                        {t.transformerNo} - {t.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspection">Inspection *</Label>
                <Select value={selectedInspection} onValueChange={setSelectedInspection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inspection" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspections.map((i) => (
                      <SelectItem key={i.id} value={i.id || ""}>
                        {i.inspectionNo} - {i.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.inspectionTimestamp && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <strong>Inspection Date:</strong> {formatDate(formData.inspectionTimestamp)}
              </div>
            )}

            {formData.thermalImageThumbnailUrl && (
              <div className="space-y-2">
                <Label>Thermal Image (with anomaly markers)</Label>
                <img
                  src={formData.thermalImageThumbnailUrl}
                  alt="Thermal image with anomalies"
                  className="w-full max-w-md rounded border"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* FR4.2: Engineer Input Fields Section */}
        <Card>
          <CardHeader>
            <CardTitle>Engineer Assessment & Recommendations</CardTitle>
            <CardDescription>Editable fields for maintenance engineer input</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectorName">Inspector Name</Label>
                <Input
                  id="inspectorName"
                  placeholder="Enter inspector name"
                  value={formData.inspectorName || ""}
                  onChange={(e) => handleInputChange("inspectorName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Transformer Status *</Label>
                <Select
                  value={formData.transformerStatus || "OK"}
                  onValueChange={(value) => handleInputChange("transformerStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OK">OK</SelectItem>
                    <SelectItem value="NEEDS_MAINTENANCE">Needs Maintenance</SelectItem>
                    <SelectItem value="URGENT_ATTENTION">Urgent Attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Electrical Readings */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Electrical Readings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voltage">Voltage (V)</Label>
                  <Input
                    id="voltage"
                    type="number"
                    placeholder="Enter voltage"
                    value={formData.voltage || ""}
                    onChange={(e) => handleInputChange("voltage", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current">Current (A)</Label>
                  <Input
                    id="current"
                    type="number"
                    placeholder="Enter current"
                    value={formData.current || ""}
                    onChange={(e) => handleInputChange("current", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency (Hz)</Label>
                  <Input
                    id="frequency"
                    type="number"
                    placeholder="Enter frequency"
                    value={formData.frequency || ""}
                    onChange={(e) => handleInputChange("frequency", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loadPercentage">Load (%)</Label>
                  <Input
                    id="loadPercentage"
                    type="number"
                    placeholder="Enter load percentage"
                    value={formData.loadPercentage || ""}
                    onChange={(e) => handleInputChange("loadPercentage", parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Text Fields */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes during inspection"
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Technical comments and observations"
                value={formData.comments || ""}
                onChange={(e) => handleInputChange("comments", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendedAction">Recommended Action</Label>
              <Textarea
                id="recommendedAction"
                placeholder="Describe the recommended maintenance action"
                value={formData.recommendedAction || ""}
                onChange={(e) => handleInputChange("recommendedAction", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalRemarks">Additional Remarks</Label>
              <Textarea
                id="additionalRemarks"
                placeholder="Any additional remarks or observations"
                value={formData.additionalRemarks || ""}
                onChange={(e) => handleInputChange("additionalRemarks", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionDueDate">Action Due Date</Label>
              <Input
                id="actionDueDate"
                type="date"
                value={formData.actionDueDate ? formData.actionDueDate.split("T")[0] : ""}
                onChange={(e) => handleInputChange("actionDueDate", e.target.value + "T00:00:00")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {recordId ? "Update Record" : "Create Record"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function formatDate(dateString?: string) {
  if (!dateString) return "-"
  return format(new Date(dateString), "PPP")
}
