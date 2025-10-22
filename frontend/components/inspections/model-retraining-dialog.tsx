"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, CheckCircle2, AlertCircle, Loader2, Upload } from "lucide-react"
import { api } from "@/lib/api"

interface ModelRetrainingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  thermalImageId?: string  // If provided, uploads single image
  mode: "single" | "all-corrections"
}

export function ModelRetrainingDialog({ 
  open, 
  onOpenChange, 
  thermalImageId,
  mode 
}: ModelRetrainingDialogProps) {
  const [split, setSplit] = useState<string>("train")
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      let result

      if (mode === "single" && thermalImageId) {
        // Upload single image
        result = await api.uploadToRoboflow(thermalImageId, split)
      } else if (mode === "all-corrections") {
        // Upload all user-corrected annotations
        result = await api.uploadUserCorrectionsToRoboflow(split)
      }

      if (result?.success) {
        setUploadResult(result.data)
      } else {
        setError(result?.message || "Upload failed")
      }
    } catch (e: any) {
      setError(e.message || "Failed to upload to Roboflow")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setUploadResult(null)
    setError(null)
    setSplit("train")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <DialogTitle>Upload to Roboflow for Retraining</DialogTitle>
          </div>
          <DialogDescription>
            {mode === "single" 
              ? "Upload this annotated image to Roboflow to improve the AI model."
              : "Upload all user-corrected annotations to Roboflow for model retraining."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dataset Split Selection */}
          <div className="space-y-2">
            <Label htmlFor="split">Dataset Split</Label>
            <Select value={split} onValueChange={setSplit} disabled={uploading}>
              <SelectTrigger id="split">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="train">Training Set (70%)</SelectItem>
                <SelectItem value="valid">Validation Set (20%)</SelectItem>
                <SelectItem value="test">Test Set (10%)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which dataset split this data should go into
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uploadResult && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Upload successful!</p>
                  {uploadResult.total !== undefined && (
                    <div className="text-xs space-y-0.5">
                      <p>Total: {uploadResult.total} images</p>
                      <p>Success: {uploadResult.success}</p>
                      {uploadResult.failure > 0 && (
                        <p className="text-red-600">Failed: {uploadResult.failure}</p>
                      )}
                    </div>
                  )}
                  {uploadResult.message && (
                    <p className="text-xs">{uploadResult.message}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!uploadResult ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Roboflow
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

