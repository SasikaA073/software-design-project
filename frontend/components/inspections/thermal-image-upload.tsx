"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, ImageIcon } from "lucide-react"

interface ThermalImageUploadProps {
  onCancel: () => void
  onProgress: (progress: number) => void
  onUpload?: (file: File) => void
}

export function ThermalImageUpload({ onCancel, onProgress, onUpload }: ThermalImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

    if (imageFile) {
      setSelectedFile(imageFile)
      startUpload(imageFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      startUpload(file)
    }
  }

  const startUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    if (onUpload) {
      await onUpload(file)
      setIsUploading(false)
      setUploadProgress(100)
      onProgress(100)
    } else {
      // fallback: simulate progress
      try {
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + Math.random() * 15
            if (newProgress >= 100) {
              clearInterval(interval)
              setIsUploading(false)
              onProgress(100)
              return 100
            }
            onProgress(newProgress)
            return newProgress
          })
        }, 200)
      } catch (error) {
        console.error("Upload failed:", error)
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  if (isUploading || uploadProgress > 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <ImageIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-medium mb-2">Thermal image uploading</h3>
          <p className="text-sm text-muted-foreground mb-4">Thermal image is being uploaded and reviewed.</p>
          <Progress value={uploadProgress} className="w-64 mx-auto mb-4" />
          <p className="text-sm font-medium">{Math.round(uploadProgress)}%</p>
          <Button variant="outline" onClick={onCancel} className="mt-4 bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">Drop your thermal image here</h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
        <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="thermal-upload" />
        <label htmlFor="thermal-upload">
          <Button variant="outline" className="cursor-pointer bg-transparent">
            Browse Files
          </Button>
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
          Cancel
        </Button>
      </div>
    </div>
  )
}
