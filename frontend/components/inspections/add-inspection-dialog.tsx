"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { api, InspectionData } from "@/lib/api";
import type { TransformerData } from "@/lib/api"

interface AddInspectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transformerNo?: string
}

export function AddInspectionDialog({ open, onOpenChange, transformerNo }: AddInspectionDialogProps) {
  const [formData, setFormData] = useState({
    branch: "",
    transformerNo: transformerNo || "",
    dateOfInspection: "",
    time: "",
    maintenanceDate: "",
    maintenanceTime: "",
    status: "",
    inspectedBy: "",
  })
  const [transformers, setTransformers] = useState<TransformerData[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load transformers when dialog opens
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const res = await api.getTransformers()
      if (res.success) {
        setTransformers(res.data)
        if (transformerNo) {
          const t = res.data.find((tr) => tr.transformerNo === transformerNo)
          if (t) {
            setFormData((prev) => ({ ...prev, branch: t.region, transformerNo: t.transformerNo }))
          }
        }
      }
    })()
  }, [open, transformerNo])

  const branchOptions = useMemo(() => Array.from(new Set(transformers.map((t) => t.region))).sort(), [transformers])

  const transformersByBranch = useMemo(
    () =>
      transformers
        .filter((t) => (formData.branch ? t.region === formData.branch : true))
        .sort((a, b) => a.transformerNo.localeCompare(b.transformerNo)),
    [transformers, formData.branch],
  )

  useEffect(() => {
    if (!formData.branch) return
    if (!transformersByBranch.find((t) => t.transformerNo === formData.transformerNo)) {
      const firstTransformer = transformersByBranch[0]?.transformerNo
      if (firstTransformer) {
        setFormData((prev) => ({ ...prev, transformerNo: firstTransformer }))
      } else {
        setFormData((prev) => ({ ...prev, transformerNo: "" }))
      }
    }
  }, [formData.branch, transformersByBranch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.transformerNo || !formData.status || !formData.inspectedBy) return

    const transformer = transformers.find((t) => t.transformerNo === formData.transformerNo)
    if (!transformer) return

    const inspectedDateIso = formData.dateOfInspection
      ? new Date(`${formData.dateOfInspection}T${formData.time || "00:00"}`).toISOString()
      : new Date().toISOString()

    const maintenanceDateIso = formData.maintenanceDate
      ? new Date(`${formData.maintenanceDate}T${formData.maintenanceTime || "00:00"}`).toISOString()
      : undefined

    const inspectionNo = `INSP-${Date.now()}`
    setSubmitting(true)

    try {
      await api.addInspection({
        inspectionNo,
        transformerId: transformer.id!,
        inspectedDate: inspectedDateIso,
        maintenanceDate: maintenanceDateIso,
        status: formData.status as "In Progress" | "Pending" | "Completed",
        inspectedBy: formData.inspectedBy,
      })
      onOpenChange(false)
      setFormData({
        branch: "",
        transformerNo: transformerNo || "",
        dateOfInspection: "",
        time: "",
        maintenanceDate: "",
        maintenanceTime: "",
        status: "",
        inspectedBy: "",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Inspection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={formData.branch}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, branch: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.filter(b => b && b.trim() !== '').map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transformer */}
          <div className="space-y-2">
            <Label htmlFor="transformerNo">Transformer No</Label>
            <Select
              value={formData.transformerNo}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, transformerNo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.branch ? "Select transformer" : "Select branch first"} />
              </SelectTrigger>
              <SelectContent>
                {transformersByBranch.filter(t => t.transformerNo && t.transformerNo.trim() !== '').map((t) => (
                  <SelectItem key={t.id} value={t.transformerNo}>
                    {t.transformerNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" className="flex-1" disabled={submitting || !formData.status || !formData.inspectedBy}>
              Confirm
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
