"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, ImageIcon } from "lucide-react"
import { Label } from "@/components/ui/label"

interface ThermalImageUploadProps {
  onCancel: () => void
  onProgress: (progress: number) => void
  onUpload?: (file: File, weatherCondition?: string) => void
  imageType?: string
  isUploading?: boolean
  showWeatherSelector?: boolean
}

export function ThermalImageUpload({ onCancel, onProgress, onUpload, imageType, isUploading = false, showWeatherSelector = false }: ThermalImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [weatherCondition, setWeatherCondition] = useState<string>("Sunny")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile && !isUploading) {
      setSelectedFile(imageFile)
      startUpload(imageFile)
    }
  }, [isUploading])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/") && !isUploading) {
      setSelectedFile(file)
      startUpload(file)
    }
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleBrowseClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const startUpload = async (file: File) => {
    setUploadProgress(0)
    if (onUpload) {
      try {
        await onUpload(file, showWeatherSelector ? weatherCondition : undefined)
        setSelectedFile(null)
        setUploadProgress(0)
        onProgress(0)
      } catch (error) {
        console.error("Upload failed:", error)
        setSelectedFile(null)
        setUploadProgress(0)
        onProgress(0)
      }
    } else {
      // fallback: simulate progress
      try {
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + Math.random() * 15
            if (newProgress >= 100) {
              clearInterval(interval)
              setSelectedFile(null)
              onProgress(0)
              return 0
            }
            onProgress(newProgress)
            return newProgress
          })
        }, 200)
      } catch (error) {
        console.error("Upload failed:", error)
        setUploadProgress(0)
        setSelectedFile(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    onProgress(0)
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">
          Drop your thermal image here{imageType ? ` (${imageType})` : ""}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <Button 
          variant="outline" 
          className="cursor-pointer bg-transparent" 
          disabled={isUploading}
          onClick={handleBrowseClick}
          type="button"
        >
          {isUploading ? "Uploading..." : "Browse Files"}
        </Button>
        
        {(isUploading || uploadProgress > 0) && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-64 mx-auto mb-2" />
            <p className="text-sm font-medium">{Math.round(uploadProgress)}%</p>
          </div>
        )}
      </div>

      {selectedFile && !isUploading && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {showWeatherSelector && (
        <div className="space-y-2">
          <Label htmlFor="weather-condition">Weather Condition</Label>
          <Select value={weatherCondition} onValueChange={setWeatherCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Select weather condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sunny">Sunny</SelectItem>
              <SelectItem value="Cloudy">Cloudy</SelectItem>
              <SelectItem value="Rainy">Rainy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent" disabled={isUploading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}