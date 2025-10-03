"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon, X } from "lucide-react"
import { api } from "@/lib/api"

interface BaselineImageCardProps {
  transformerId: string
  weatherCondition: "Sunny" | "Cloudy" | "Rainy"
  imageUrl?: string
  onUploadSuccess: () => void
}

export function BaselineImageCard({
  transformerId,
  weatherCondition,
  imageUrl,
  onUploadSuccess,
}: BaselineImageCardProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return
    }

    setError(null)
    setUploading(true)

    try {
      const res = await api.uploadBaselineImage(transformerId, weatherCondition, file)
      if (res.success) {
        // Update preview with the new image
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
        onUploadSuccess()
      } else {
        setError(res.message || "Failed to upload image")
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const getWeatherIcon = () => {
    switch (weatherCondition) {
      case "Sunny":
        return "☀️"
      case "Cloudy":
        return "☁️"
      case "Rainy":
        return "🌧️"
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <span>{getWeatherIcon()}</span>
              {weatherCondition}
            </h3>
          </div>

          {previewUrl ? (
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden group">
              <img
                src={previewUrl}
                alt={`${weatherCondition} baseline`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label htmlFor={`upload-${weatherCondition}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    disabled={uploading}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(`upload-${weatherCondition}`)?.click()
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Change"}
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <label
              htmlFor={`upload-${weatherCondition}`}
              className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground mb-1">
                {uploading ? "Uploading..." : "Click to upload"}
              </span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
            </label>
          )}

          <input
            id={`upload-${weatherCondition}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />

          {error && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <X className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
