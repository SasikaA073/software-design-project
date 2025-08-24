"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
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
        // Preselect branch from incoming transformerNo if provided
        if (transformerNo) {
          const t = res.data.find((tr) => tr.transformerNo === transformerNo)
          if (t) {
            setFormData((prev) => ({ ...prev, branch: t.region, transformerNo: t.transformerNo }))
          }
        }
      }
    })()
  }, [open, transformerNo])

  // Branch options derived from transformers
  const branchOptions = useMemo(() => Array.from(new Set(transformers.map((t) => t.region))).sort(), [transformers])

  // Transformers filtered by selected branch
  const transformersByBranch = useMemo(
    () =>
      transformers
        .filter((t) => (formData.branch ? t.region === formData.branch : true))
        .sort((a, b) => a.transformerNo.localeCompare(b.transformerNo)),
    [transformers, formData.branch],
  )

  // Keep transformer in sync with branch
  useEffect(() => {
    if (!formData.branch) return
    if (!transformersByBranch.find((t) => t.transformerNo === formData.transformerNo)) {
      setFormData((prev) => ({ ...prev, transformerNo: transformersByBranch[0]?.transformerNo || "" }))
    }
  }, [formData.branch, transformersByBranch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.transformerNo) return
    const transformer = transformers.find((t) => t.transformerNo === formData.transformerNo)
    if (!transformer) return

    const inspectedDateIso = formData.dateOfInspection
      ? new Date(`${formData.dateOfInspection}T${formData.time || "00:00"}`).toISOString()
      : new Date().toISOString()

    const inspectionNo = `INSP-${Date.now()}`



    setSubmitting(true)
    console.log("transformerID", transformer.id)

    try {

      await api.addInspection({
        inspectionNo,
        transformerId: transformer.id!,
        inspectedDate: inspectedDateIso,
        status: "In Progress",
        inspectedBy: "",
      })
      onOpenChange(false)
      setFormData({ branch: "", transformerNo: transformerNo || "", dateOfInspection: "", time: "" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>New Inspection</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                {branchOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {transformersByBranch.map((t) => (
                  <SelectItem key={t.id} value={t.transformerNo}>
                    {t.transformerNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfInspection">Date of Inspection</Label>
            <Input
              id="dateOfInspection"
              type="date"
              value={formData.dateOfInspection}
              onChange={(e) => setFormData((prev) => ({ ...prev, dateOfInspection: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
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
