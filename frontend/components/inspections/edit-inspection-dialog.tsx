"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { api, InspectionData } from "@/lib/api"

interface EditInspectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inspection: InspectionData
  onSuccess?: () => void
}

export function EditInspectionDialog({ open, onOpenChange, inspection, onSuccess }: EditInspectionDialogProps) {
  const [formData, setFormData] = useState({
    dateOfInspection: "",
    time: "",
    maintenanceDate: "",
    maintenanceTime: "",
    status: "",
    inspectedBy: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-populate form when inspection changes
  useEffect(() => {
    if (inspection) {
      const inspectedDate = inspection.inspectedDate ? new Date(inspection.inspectedDate) : null
      const maintenanceDate = inspection.maintenanceDate ? new Date(inspection.maintenanceDate) : null

      setFormData({
        dateOfInspection: inspectedDate ? inspectedDate.toISOString().split('T')[0] : "",
        time: inspectedDate ? inspectedDate.toTimeString().slice(0, 5) : "",
        maintenanceDate: maintenanceDate ? maintenanceDate.toISOString().split('T')[0] : "",
        maintenanceTime: maintenanceDate ? maintenanceDate.toTimeString().slice(0, 5) : "",
        status: inspection.status || "",
        inspectedBy: inspection.inspectedBy || "",
      })
    }
  }, [inspection])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const inspectedDateIso = formData.dateOfInspection
        ? new Date(`${formData.dateOfInspection}T${formData.time || "00:00"}`).toISOString()
        : undefined

      const maintenanceDateIso = formData.maintenanceDate
        ? new Date(`${formData.maintenanceDate}T${formData.maintenanceTime || "00:00"}`).toISOString()
        : undefined

      const payload: Partial<InspectionData> = {
        inspectedDate: inspectedDateIso,
        maintenanceDate: maintenanceDateIso,
        status: formData.status as "In Progress" | "Pending" | "Completed",
        inspectedBy: formData.inspectedBy,
      }

      const res = await api.updateInspection(inspection.id!, payload)
      if (!res.success) {
        setError(res.message || "Failed to update inspection.")
        setLoading(false)
        return
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to update inspection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inspection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Read-only info */}
          <div className="p-3 bg-muted rounded-md space-y-1">
            <p className="text-sm"><span className="font-semibold">Inspection No:</span> {inspection.inspectionNo}</p>
            <p className="text-sm"><span className="font-semibold">Transformer:</span> {inspection.transformer?.transformerNo}</p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inspected By */}
          <div className="space-y-2">
            <Label htmlFor="inspectedBy">Inspected By</Label>
            <Input
              id="inspectedBy"
              type="text"
              value={formData.inspectedBy}
              onChange={(e) => setFormData((prev) => ({ ...prev, inspectedBy: e.target.value }))}
              placeholder="Enter inspector name"
              required
            />
          </div>

          {/* Date of Inspection */}
          <div className="space-y-2">
            <Label htmlFor="dateOfInspection">Date of Inspection</Label>
            <Input
              id="dateOfInspection"
              type="date"
              value={formData.dateOfInspection}
              onChange={(e) => setFormData((prev) => ({ ...prev, dateOfInspection: e.target.value }))}
            />
          </div>

          {/* Inspection Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Inspection Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          {/* Maintenance Date */}
          <div className="space-y-2">
            <Label htmlFor="maintenanceDate">Maintenance Date (Optional)</Label>
            <Input
              id="maintenanceDate"
              type="date"
              value={formData.maintenanceDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, maintenanceDate: e.target.value }))}
              placeholder="Leave empty if no maintenance scheduled"
            />
          </div>

          {/* Maintenance Time */}
          <div className="space-y-2">
            <Label htmlFor="maintenanceTime">Maintenance Time</Label>
            <Input
              id="maintenanceTime"
              type="time"
              value={formData.maintenanceTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, maintenanceTime: e.target.value }))}
              disabled={!formData.maintenanceDate}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

