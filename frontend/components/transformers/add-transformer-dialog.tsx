"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { api, TransformerData } from "@/lib/api";

interface AddTransformerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTransformerDialog({ open, onOpenChange }: AddTransformerDialogProps) {

  const [formData, setFormData] = useState({
    region: "",
    transformerNo: "",
    poleNo: "",
    type: "",
    locationDetails: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Prepare data for API
      const type: "Distribution" | "Bulk" =
        formData.type === "distribution"
          ? "Distribution"
          : formData.type === "bulk"
          ? "Bulk"
          : "Distribution"; // fallback/default

      const payload: TransformerData = {
        transformerNo: formData.transformerNo,
        poleNo: formData.poleNo,
        region: formData.region,
        type,
        capacity: 0, // Default, you can add this to the form if needed
        noOfFeeders: 0, // Default, you can add this to the form if needed
        locationDetails: formData.locationDetails,
        status: "Operational", // Default status
      }
      const res = await api.addTransformer(payload)
      if (!res.success) {
        setError(res.message || "Failed to add transformer.")
        setLoading(false)
        return
      }
      onOpenChange(false)
      // Reset form
      setFormData({
        region: "",
        transformerNo: "",
        poleNo: "",
        type: "",
        locationDetails: "",
      })
    } catch (err: any) {
      setError(err.message || "Failed to add transformer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Add Transformer</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="poleNo">Pole No</Label>
            <Input
              id="poleNo"
              value={formData.poleNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, poleNo: e.target.value }))}
              placeholder="e.g., EN-123-B"
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
              {loading ? "Adding..." : "Confirm"}
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
