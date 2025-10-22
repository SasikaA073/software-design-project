"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Upload, ImageIcon, Thermometer, Pencil, Trash2, Brain } from "lucide-react"
import { ThermalImageUpload } from "./thermal-image-upload"
import { ThermalImageCanvas, DetectionMetadata } from "./thermal-image-canvas"
import { EditInspectionDialog } from "./edit-inspection-dialog"
import { ModelRetrainingDialog } from "./model-retraining-dialog"
import { FeedbackLogExport } from "./feedback-log-export"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { InspectionData, ThermalImageData, Detection } from "@/lib/api"
import { api } from "@/lib/api"

interface InspectionDetailsProps {
  inspectionId: string
  onBack: () => void
}

export function InspectionDetails({ inspectionId, onBack }: InspectionDetailsProps) {
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [images, setImages] = useState<ThermalImageData[]>([])
  const [baselineImageUrl, setBaselineImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [weatherCondition, setWeatherCondition] = useState<"Sunny" | "Cloudy" | "Rainy">("Sunny")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadingBaseline, setUploadingBaseline] = useState(false)
  const [uploadingMaintenance, setUploadingMaintenance] = useState(false)
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false)
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState<number | null>(null)
  const [highlightedBoxIndex, setHighlightedBoxIndex] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showRetrainingDialog, setShowRetrainingDialog] = useState(false)

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
      } catch (e: any) {
        if (isMounted) {
          setError(e.message || "Failed to load data")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [inspectionId])

  // Fetch baseline image when weather condition changes or inspection is loaded
  useEffect(() => {
    async function fetchBaselineImage() {
      console.log("🔍 Fetching baseline image...")
      console.log("  - Transformer ID:", inspection?.transformerId)
      console.log("  - Weather Condition:", weatherCondition)
      
      if (inspection?.transformerId) {
        try {
          const response = await api.getBaselineImageUrl(inspection.transformerId, weatherCondition)
          console.log("📸 Baseline image response:", response)
          
          if (response.success && response.data) {
            console.log("✅ Baseline image URL set:", response.data)
            setBaselineImageUrl(response.data)
          } else {
            console.log("❌ No baseline image available")
            setBaselineImageUrl(null)
          }
        } catch (error) {
          console.error("❌ Failed to fetch baseline image:", error)
          setBaselineImageUrl(null)
        }
      } else {
        console.log("⚠️ No transformer ID available")
      }
    }
    fetchBaselineImage()
  }, [inspection?.transformerId, weatherCondition])

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

  // Load annotations from backend (FR3.2)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loadingAnnotations, setLoadingAnnotations] = useState(false)

  // Load annotations when maintenance image changes
  useEffect(() => {
    const loadAnnotations = async () => {
      if (!maintenanceImage?.id) {
        setDetections([])
        return
      }

      setLoadingAnnotations(true)
      try {
        // Try to load from new Annotation API first (FR3.2)
        const annotationRes = await api.getAnnotations(maintenanceImage.id, false)
        if (annotationRes.success && annotationRes.data.length > 0) {
          // Convert Annotation entities to Detection format
          const loadedDetections = annotationRes.data.map((annotation: any) => ({
            detection_id: annotation.detectionId || annotation.detection_id,
            class: annotation.detectionClass || annotation.class,
            confidence: annotation.confidence,
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            annotationType: annotation.annotationType,
            comments: annotation.comments,
            createdAt: annotation.createdAt,
            createdBy: annotation.createdBy,
            modifiedAt: annotation.modifiedAt,
            modifiedBy: annotation.modifiedBy,
          }))
          setDetections(loadedDetections)
          console.log("✅ Loaded annotations from Annotation API (FR3.2)")
        } else {
          // Fallback to legacy JSON string for backward compatibility
          if (maintenanceImage.detectionData) {
            try {
              const parsed = JSON.parse(maintenanceImage.detectionData) as Detection[]
              setDetections(parsed)
              console.log("⚠️ Loaded from legacy detectionData JSON (fallback)")
            } catch (e) {
              console.error("Failed to parse detection data:", e)
              setDetections([])
            }
          } else {
            setDetections([])
          }
        }
      } catch (error) {
        console.error("Failed to load annotations:", error)
        // Fallback to legacy JSON string
        if (maintenanceImage.detectionData) {
          try {
            const parsed = JSON.parse(maintenanceImage.detectionData) as Detection[]
            setDetections(parsed)
          } catch (e) {
            setDetections([])
          }
        }
      } finally {
        setLoadingAnnotations(false)
      }
    }

    loadAnnotations()
  }, [maintenanceImage?.id, maintenanceImage?.detectionData])

  // Check if we have any images
  const hasAnyImages = useMemo(() => images && images.length > 0, [images])

  // Auto-set weather condition based on maintenance image weather condition
  useEffect(() => {
    if (maintenanceImage?.weatherCondition && maintenanceImage.weatherCondition !== weatherCondition) {
      setWeatherCondition(maintenanceImage.weatherCondition as "Sunny" | "Cloudy" | "Rainy")
    }
  }, [maintenanceImage?.weatherCondition, weatherCondition])

  // Upload handlers
  const handleUploadBaseline = async (file: File, weatherCondition?: string) => {
    setUploadingBaseline(true)
    setUploadProgress(0)
    try {
      const res = await api.uploadThermalImage(inspectionId, file, "Baseline", weatherCondition)
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

  const handleUploadMaintenance = async (file: File, weatherCondition?: string) => {
    setUploadingMaintenance(true)
    setUploadProgress(0)
    setAiAnalysisComplete(false)
    
    try {
      // Stage 1: Upload progress (0-40%)
      setUploadProgress(10)
      await new Promise(resolve => setTimeout(resolve, 300))
      setUploadProgress(20)
      await new Promise(resolve => setTimeout(resolve, 300))
      setUploadProgress(30)
      
      const res = await api.uploadThermalImage(inspectionId, file, "Maintenance", weatherCondition)
      
      if (res.success) {
        setUploadProgress(40)
        
        // Stage 2: AI Analysis simulation (40-70%)
        setUploadProgress(50)
        await new Promise(resolve => setTimeout(resolve, 500))
        setUploadProgress(60)
        await new Promise(resolve => setTimeout(resolve, 500))
        setUploadProgress(70)
        
        // Stage 3: Fetching results (70-100%)
        const imgsRes = await api.getThermalImages(inspectionId)
        setUploadProgress(80)
        
        if (imgsRes.success) {
          setImages(imgsRes.data)
          setUploadProgress(90)
          await new Promise(resolve => setTimeout(resolve, 300))
          setUploadProgress(100)
          setAiAnalysisComplete(true)
          
          // Reset after 2 seconds
          setTimeout(() => {
            setUploadProgress(0)
            setShowUpload(false)
          }, 2000)
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

  // Handler for detection changes (FR3.2: Metadata and Annotation Persistence)
  const handleDetectionsChange = async (updatedDetections: Detection[]) => {
    if (!maintenanceImage?.id) return

    try {
      // Save to new Annotation API with full metadata (FR3.2)
      const userId = "system" // Replace with actual user ID when authentication is implemented
      const annotationRes = await api.syncAnnotations(maintenanceImage.id, updatedDetections, userId)
      
      if (annotationRes.success) {
        console.log("✅ Annotations saved with metadata (FR3.2)")
        
        // Also update legacy detectionData for backward compatibility
        const legacyRes = await api.updateDetectionData(maintenanceImage.id, updatedDetections)
        
        // Reload annotations to get updated metadata from backend
        const reloadRes = await api.getAnnotations(maintenanceImage.id, false)
        if (reloadRes.success) {
          // Convert and update local state
          const loadedDetections = reloadRes.data.map((annotation: any) => ({
            detection_id: annotation.detectionId || annotation.detection_id,
            class: annotation.detectionClass || annotation.class,
            confidence: annotation.confidence,
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            annotationType: annotation.annotationType,
            comments: annotation.comments,
            createdAt: annotation.createdAt,
            createdBy: annotation.createdBy,
            modifiedAt: annotation.modifiedAt,
            modifiedBy: annotation.modifiedBy,
          }))
          setDetections(loadedDetections)
        }
        
        // Refresh images
        const imgsRes = await api.getThermalImages(inspectionId)
        if (imgsRes.success) {
          setImages(imgsRes.data)
        }
      } else {
        console.error("❌ Annotation sync failed:", annotationRes.message)
        setError(`Failed to sync annotations: ${annotationRes.message || "Unknown error"}`)
      }
    } catch (e: any) {
      console.error("❌ Failed to save annotations:", e)
      setError(`Failed to sync annotations: ${e.message || "Network error"}`)
    }
  }

  const fetchInspectionData = async () => {
    const inspRes = await api.getInspection(inspectionId)
    if (inspRes.success) {
      setInspection(inspRes.data)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!inspection?.id) return
    
    setDeleting(true)
    try {
      const res = await api.deleteInspection(inspection.id)
      if (res.success) {
        onBack() // Go back to list after deleting
      } else {
        setError(res.message || "Failed to delete inspection.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete inspection.")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <FeedbackLogExport />
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit Inspection
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDeleteDialog(true)} 
            className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
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
              <span className="font-medium">{inspection?.transformer?.poleNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium">{inspection?.transformer?.locationDetails || "-"}</span>
            </div>

            {inspection?.maintenanceDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance Time</span>
              <span className="font-medium">
                {formatDate(inspection.maintenanceDate)}
              </span>
            </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inspected By</span>
              <span className="font-medium">{inspection?.inspectedBy || "-"}</span>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground">Weather Condition</span>
              <Select value={weatherCondition} onValueChange={(value: string) => setWeatherCondition(value as "Sunny" | "Cloudy" | "Rainy")}>
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
            ) : (
              <>
                {/* Always show the comparison view */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium">Image Comparison Analysis</h3>
                    <Badge variant="outline" className="text-xs">
                      Compare baseline vs maintenance
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compare the baseline reference image with the current maintenance inspection image to identify thermal anomalies.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Baseline Image Section - Auto-retrieved based on weather condition */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-semibold">Baseline Image ({weatherCondition})</h4>
                      {/* <Select value={weatherCondition} onValueChange={(value: string) => setWeatherCondition(value as "Sunny" | "Cloudy" | "Rainy")}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunny">Sunny</SelectItem>
                          <SelectItem value="Cloudy">Cloudy</SelectItem>
                          <SelectItem value="Rainy">Rainy</SelectItem>
                        </SelectContent>
                      </Select> */}
                    </div>
                    {baselineImageUrl ? (
                      <div className="relative rounded-md overflow-hidden border">
                        <img
                          src={baselineImageUrl}
                          alt={`Thermal Baseline (${weatherCondition})`}
                          className="w-full h-[360px] object-cover"
                        />
                        <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                          Baseline image for {weatherCondition} weather condition
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[360px] border rounded-md bg-muted/10">
                        <div className="text-center space-y-2">
                          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No baseline image available for {weatherCondition} weather condition
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Upload baseline images when creating the transformer
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Maintenance Image Section - With weather condition tagging and bounding boxes */}
                  <div>
                    <div className="mb-2">
                      <h4 className="font-semibold">Maintenance Image</h4>
                    </div>
                    {maintenanceImage ? (
                      <div>
                        <ThermalImageCanvas
                          imageUrl={maintenanceImage.imageUrl}
                          detections={detections}
                          alt="Thermal Maintenance"
                          onDetectionsChange={handleDetectionsChange}
                          highlightedBoxIndex={highlightedBoxIndex}
                          onHighlightDetection={setHighlightedBoxIndex}
                        />
                        <div className="px-3 py-2 text-xs text-muted-foreground border border-t-0 rounded-b-md">
                          {maintenanceImage.weatherCondition && (
                            <span className="mr-2">Weather: {maintenanceImage.weatherCondition}</span>
                          )}
                          {maintenanceImage.uploadedAt ? formatDate(maintenanceImage.uploadedAt) : ""}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[360px] border rounded-md bg-muted/10">
                        <div className="text-center space-y-2">
                          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-4">
                            No maintenance image uploaded yet
                          </p>
                          <Button onClick={() => setShowUpload(true)} className="gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Maintenance Image
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detection Metadata Section - Above Progress */}
      {maintenanceImage && detections.length > 0 && (
        <div className="space-y-4">
          <DetectionMetadata
            detections={detections}
            selectedBoxIndex={selectedDetectionIndex}
            editMode={isEditMode}
            onSelectDetection={setSelectedDetectionIndex}
            highlightedBoxIndex={highlightedBoxIndex}
            onHighlightDetection={setHighlightedBoxIndex}
          />
          
          {/* Model Retraining Button */}
          {detections.some(d => d.annotationType === "user_added" || d.annotationType === "user_edited") && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowRetrainingDialog(true)}
                className="gap-2"
              >
                <Brain className="w-4 h-4" />
                Upload to Roboflow for Retraining
              </Button>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress Bar */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {uploadProgress === 0 && !maintenanceImage && "Waiting for Upload"}
                {uploadProgress > 0 && uploadProgress < 40 && "Uploading Image..."}
                {uploadProgress >= 40 && uploadProgress < 70 && "Running AI Analysis..."}
                {uploadProgress >= 70 && uploadProgress < 100 && "Processing Results..."}
                {uploadProgress === 100 && "Complete!"}
                {uploadProgress === 0 && maintenanceImage && "Inspection Ready"}
              </span>
              <span className="text-sm text-muted-foreground">
                {uploadProgress > 0 ? `${uploadProgress}%` : maintenanceImage ? "100%" : "0%"}
              </span>
            </div>
            <Progress 
              value={uploadProgress > 0 ? uploadProgress : maintenanceImage ? 100 : 0} 
              className="h-2" 
            />

            {/* Progress Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {/* Step 1: Image Upload */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  uploadProgress >= 40 || maintenanceImage 
                    ? "bg-green-500" 
                    : uploadProgress > 0 
                    ? "bg-blue-500 animate-pulse" 
                    : "bg-muted"
                }`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Image Upload</span>
                  <span className="text-xs text-muted-foreground">
                    {uploadProgress >= 40 || maintenanceImage ? "Complete" : uploadProgress > 0 ? "In Progress" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 2: AI Analysis */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  uploadProgress >= 70 || (maintenanceImage && detections.length > 0)
                    ? "bg-green-500" 
                    : uploadProgress >= 40 
                    ? "bg-blue-500 animate-pulse" 
                    : "bg-muted"
                }`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">AI Analysis</span>
                  <span className="text-xs text-muted-foreground">
                    {uploadProgress >= 70 || (maintenanceImage && detections.length > 0)
                      ? "Complete" 
                      : uploadProgress >= 40 
                      ? "Analyzing..." 
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 3: Detection Results */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  uploadProgress === 100 || (maintenanceImage && detections.length > 0)
                    ? "bg-green-500" 
                    : uploadProgress >= 70 
                    ? "bg-blue-500 animate-pulse" 
                    : "bg-muted"
                }`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Detection Results</span>
                  <span className="text-xs text-muted-foreground">
                    {maintenanceImage && detections.length > 0 
                      ? `${detections.length} detected` 
                      : uploadProgress >= 70 
                      ? "Processing..." 
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 4: Review */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  maintenanceImage && detections.length > 0
                    ? "bg-green-500" 
                    : "bg-muted"
                }`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Ready for Review</span>
                  <span className="text-xs text-muted-foreground">
                    {maintenanceImage && detections.length > 0 ? "Available" : "Waiting"}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            {maintenanceImage && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{maintenanceImage ? "✓" : "—"}</p>
                    <p className="text-xs text-muted-foreground">Image Uploaded</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{detections.length}</p>
                    <p className="text-xs text-muted-foreground">Anomalies Found</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {detections.filter(d => d.class === "faulty").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Faulty</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {detections.filter(d => d.class === "potentially_faulty").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Potential</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Maintenance Image Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Maintenance Thermal Image</DialogTitle>
          </DialogHeader>
          <ThermalImageUpload
            imageType="Maintenance"
            onCancel={() => setShowUpload(false)}
            onProgress={setUploadProgress}
            onUpload={handleUploadMaintenance}
            isUploading={uploadingMaintenance}
            showWeatherSelector={true}
          />
        </DialogContent>
      </Dialog>

      {inspection && (
        <>
          <EditInspectionDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog}
            inspection={inspection}
            onSuccess={fetchInspectionData}
          />
          
          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Inspection"
            description={`Are you sure you want to delete inspection "${inspection.inspectionNo}"? This action cannot be undone and will also delete all ${images.length} associated thermal image(s).`}
            onConfirm={handleDeleteConfirm}
            confirmText={deleting ? "Deleting..." : "Delete"}
            variant="destructive"
          />
          
          <ModelRetrainingDialog
            open={showRetrainingDialog}
            onOpenChange={setShowRetrainingDialog}
            thermalImageId={maintenanceImage?.id}
            mode="single"
          />
        </>
      )}
    </div>
  )
}