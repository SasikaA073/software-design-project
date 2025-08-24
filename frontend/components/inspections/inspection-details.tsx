"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, ImageIcon, Thermometer } from "lucide-react"
import { ThermalImageUpload } from "./thermal-image-upload"
import type { InspectionData, ThermalImageData } from "@/lib/api"
import { api } from "@/lib/api"

interface InspectionDetailsProps {
  inspectionId: string
  onBack: () => void
}

export function InspectionDetails({ inspectionId, onBack }: InspectionDetailsProps) {
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [images, setImages] = useState<ThermalImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [weatherCondition, setWeatherCondition] = useState<"Sunny" | "Cloudy" | "Rainy">("Sunny")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadingBaseline, setUploadingBaseline] = useState(false)
  const [uploadingMaintenance, setUploadingMaintenance] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function fetchData() {
      try {
        setLoading(true)
        const [inspRes, imgsRes] = await Promise.all([api.getInspection(inspectionId), api.getThermalImages(inspectionId)])
        if (!isMounted) return
        if (inspRes.success) {
          console.log("Inspection Data:", inspRes.data)
          setInspection(inspRes.data)
          if (inspRes.data.weatherCondition) {
            setWeatherCondition(inspRes.data.weatherCondition)
          }
        } else {
          setError(inspRes.message || "Failed to load inspection")
        }
        if (imgsRes.success) {
          console.log("Thermal Images:", imgsRes.data)
          setImages(imgsRes.data)
        }
      } catch (e) {
        if (!isMounted) return
        setError(e instanceof Error ? e.message : "Failed to load data")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [inspectionId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get baseline and maintenance images
  const baselineImage = useMemo(() => images.find(img => img.imageType === "Baseline"), [images])
  const maintenanceImage = useMemo(() => images.find(img => img.imageType === "Maintenance"), [images])

  // Check if we have any images
  const hasAnyImages = useMemo(() => images && images.length > 0, [images])

  // Dual upload handlers
  const handleUploadBaseline = async (file: File) => {
    setUploadingBaseline(true)
    setUploadProgress(0)
    try {
      const res = await api.uploadThermalImage(inspectionId, file, "Baseline")
      if (res.success) {
        const imgsRes = await api.getThermalImages(inspectionId)
        if (imgsRes.success) {
          setImages(imgsRes.data)
        }
      } else {
        setError(res.message || "Failed to upload baseline image")
      }
    } catch (e: any) {
      setError(e.message || "Failed to upload baseline image")
    } finally {
      setUploadingBaseline(false)
    }
  }

  const handleUploadMaintenance = async (file: File) => {
    setUploadingMaintenance(true)
    setUploadProgress(0)
    try {
      const res = await api.uploadThermalImage(inspectionId, file, "Maintenance")
      if (res.success) {
        const imgsRes = await api.getThermalImages(inspectionId)
        if (imgsRes.success) {
          setImages(imgsRes.data)
        }
      } else {
        setError(res.message || "Failed to upload maintenance image")
      }
    } catch (e: any) {
      setError(e.message || "Failed to upload maintenance image")
    } finally {
      setUploadingMaintenance(false)
    }
  }

  const handleReplaceImage = (imageType: "Baseline" | "Maintenance") => {
    // Allow replacing existing images
    if (imageType === "Baseline") {
      // Remove the baseline image from state to show uploader
      setImages(prev => prev.filter(img => img.imageType !== "Baseline"))
    } else {
      // Remove the maintenance image from state to show uploader
      setImages(prev => prev.filter(img => img.imageType !== "Maintenance"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{inspection?.inspectionNo || "Inspection"}</h1>
          <p className="text-muted-foreground">
            {inspection?.transformerNo || ""}
            {inspection?.inspectedDate ? ` - ${formatDate(inspection.inspectedDate)}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={getStatusColor(inspection?.status || "Pending")}>{inspection?.status || "Pending"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transformer No</span>
              <span className="font-medium">{inspection?.transformer?.transformerNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pole No</span>
              <span className="font-medium">EN-122-A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium">Nugegoda</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inspected By</span>
              <span className="font-medium">{inspection?.inspectedBy || "-"}</span>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground">Weather Condition</span>
              <Select value={weatherCondition} onValueChange={value => setWeatherCondition(value as "Sunny" | "Cloudy" | "Rainy")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunny">Sunny</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Rainy">Rainy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              Thermal Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="h-72 flex items-center justify-center text-red-600 text-sm">{error}</div>
            ) : !hasAnyImages && !showUpload ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Upload baseline and maintenance thermal images</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upload both images to identify potential issues.</p>
                  <Button onClick={() => setShowUpload(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Thermal Images
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Baseline Image Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Baseline Image</h4>
                    {baselineImage && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReplaceImage("Baseline")}
                        disabled={uploadingBaseline}
                      >
                        Replace
                      </Button>
                    )}
                  </div>
                  {baselineImage ? (
                    <div className="relative rounded-md overflow-hidden border">
                      <img
                        src={baselineImage.imageUrl}
                        alt="Thermal Baseline"
                        className="w-full h-[360px] object-cover"
                      />
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        {baselineImage.uploadedAt ? formatDate(baselineImage.uploadedAt) : ""}
                      </div>
                    </div>
                  ) : (
                    <ThermalImageUpload
                      imageType="Baseline"
                      onCancel={() => setShowUpload(false)}
                      onProgress={setUploadProgress}
                      onUpload={handleUploadBaseline}
                      isUploading={uploadingBaseline}
                    />
                  )}
                </div>

                {/* Maintenance Image Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Maintenance Image</h4>
                    {maintenanceImage && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReplaceImage("Maintenance")}
                        disabled={uploadingMaintenance}
                      >
                        Replace
                      </Button>
                    )}
                  </div>
                  {maintenanceImage ? (
                    <div className="relative rounded-md overflow-hidden border">
                      <img
                        src={maintenanceImage.imageUrl}
                        alt="Thermal Maintenance"
                        className="w-full h-[360px] object-cover"
                      />
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        {maintenanceImage.uploadedAt ? formatDate(maintenanceImage.uploadedAt) : ""}
                      </div>
                    </div>
                  ) : (
                    <ThermalImageUpload
                      imageType="Maintenance"
                      onCancel={() => setShowUpload(false)}
                      onProgress={setUploadProgress}
                      onUpload={handleUploadMaintenance}
                      isUploading={uploadingMaintenance}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Thermal Image Upload</span>
              <span className="text-sm text-muted-foreground">
                {uploadProgress > 0 ? `${uploadProgress}%` : "Pending"}
              </span>
            </div>
            <Progress value={uploadProgress} className="h-2" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${uploadProgress > 0 ? "bg-primary" : "bg-muted"}`} />
                <span className="text-sm">Thermal Image Upload</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${uploadProgress >= 100 ? "bg-primary" : "bg-muted"}`} />
                <span className="text-sm">AI Analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-muted`} />
                <span className="text-sm">Thermal Image Review</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}