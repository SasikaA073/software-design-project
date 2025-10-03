"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { api, TransformerData } from "@/lib/api"

interface EditTransformerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transformer: TransformerData
  onSuccess?: () => void
}

export function EditTransformerDialog({ open, onOpenChange, transformer, onSuccess }: EditTransformerDialogProps) {
  const [formData, setFormData] = useState({
    region: "",
    transformerNo: "",
    poleNo: "",
    type: "",
    locationDetails: "",
    capacity: 0,
    noOfFeeders: 0,
    status: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-populate form when transformer changes
  useEffect(() => {
    if (transformer) {
      setFormData({
        region: transformer.region || "",
        transformerNo: transformer.transformerNo || "",
        poleNo: transformer.poleNo || "",
        type: transformer.type?.toLowerCase() || "",
        locationDetails: transformer.locationDetails || "",
        capacity: transformer.capacity || 0,
        noOfFeeders: transformer.noOfFeeders || 0,
        status: transformer.status || "Operational",
      })
    }
  }, [transformer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const type: "Distribution" | "Bulk" =
        formData.type === "distribution"
          ? "Distribution"
          : formData.type === "bulk"
          ? "Bulk"
          : "Distribution"

      const payload: Partial<TransformerData> = {
        transformerNo: formData.transformerNo,
        poleNo: formData.poleNo,
        region: formData.region,
        type,
        capacity: formData.capacity,
        noOfFeeders: formData.noOfFeeders,
        locationDetails: formData.locationDetails,
        status: formData.status,
      }

      const res = await api.updateTransformer(transformer.id!, payload)
      if (!res.success) {
        setError(res.message || "Failed to update transformer.")
        setLoading(false)
        return
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to update transformer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transformer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select
              value={formData.region}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nugegoda">Nugegoda</SelectItem>
                <SelectItem value="colombo">Colombo</SelectItem>
                <SelectItem value="kandy">Kandy</SelectItem>
                <SelectItem value="galle">Galle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transformerNo">Transformer No</Label>
            <Input
              id="transformerNo"
              value={formData.transformerNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, transformerNo: e.target.value }))}
              placeholder="e.g., AZ-8890"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="poleNo">Pole No</Label>
            <Input
              id="poleNo"
              value={formData.poleNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, poleNo: e.target.value }))}
              placeholder="e.g., EN-123-B"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distribution">Distribution</SelectItem>
                <SelectItem value="bulk">Bulk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (kVA)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData((prev) => ({ ...prev, capacity: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="noOfFeeders">Number of Feeders</Label>
            <Input
              id="noOfFeeders"
              type="number"
              value={formData.noOfFeeders}
              onChange={(e) => setFormData((prev) => ({ ...prev, noOfFeeders: parseInt(e.target.value) || 0 }))}
              placeholder="e.g., 4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationDetails">Location Details</Label>
            <Input
              id="locationDetails"
              value={formData.locationDetails}
              onChange={(e) => setFormData((prev) => ({ ...prev, locationDetails: e.target.value }))}
              placeholder="Enter location details"
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

