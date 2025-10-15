"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, Edit3, Save, X, Trash2, Plus } from "lucide-react"
import type { Detection } from "@/lib/api"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import { Input } from "@/components/ui/input"

// Import Button separately for DetectionMetadata to avoid issues

interface ThermalImageCanvasProps {
  imageUrl: string
  detections?: Detection[]
  alt?: string
  className?: string
  onDetectionsChange?: (detections: Detection[]) => void
  highlightedBoxIndex?: number | null
  onHighlightDetection?: (index: number | null) => void
}

// Color mapping for different classes
const CLASS_COLORS: Record<string, string> = {
  faulty: "#ff0000", // Red
  potentially_faulty: "#ff9800", // Orange
  normal: "#00ff00", // Green
  default: "#00bcd4", // Cyan
}

function getColorForClass(className: string): string {
  return CLASS_COLORS[className.toLowerCase()] || CLASS_COLORS.default
}

type ResizeHandle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | null

export function ThermalImageCanvas({
  imageUrl,
  detections: initialDetections = [],
  alt = "Thermal Image",
  className = "",
  onDetectionsChange,
  highlightedBoxIndex: externalHighlightedBoxIndex = null,
  onHighlightDetection,
}: ThermalImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Detection editing state
  const [detections, setDetections] = useState<Detection[]>(initialDetections)
  const [editMode, setEditMode] = useState(false)
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null)
  const [hoveredBoxIndex, setHoveredBoxIndex] = useState<number | null>(null)
  const [highlightedBoxIndex, setHighlightedBoxIndex] = useState<number | null>(null)

  // Transform state
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Box editing state
  const [isDraggingBox, setIsDraggingBox] = useState(false)
  const [isResizingBox, setIsResizingBox] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [detectionToDelete, setDetectionToDelete] = useState<number | null>(null)
  
  // Drawing new box state
  const [isDrawingNewBox, setIsDrawingNewBox] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null)
  const [showNewBoxDialog, setShowNewBoxDialog] = useState(false)
  const [newBoxData, setNewBoxData] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [newBoxClass, setNewBoxClass] = useState<string>("faulty")
  const [newBoxConfidence, setNewBoxConfidence] = useState<string>("0.95")
  const [newBoxComments, setNewBoxComments] = useState<string>("")
  
  // Track original detections for edit detection
  const [originalDetections, setOriginalDetections] = useState<Detection[]>(initialDetections)

  // Update detections when prop changes
  useEffect(() => {
    setDetections(initialDetections)
    setOriginalDetections(initialDetections)
  }, [initialDetections])

  // Update highlighted box index when prop changes
  useEffect(() => {
    setHighlightedBoxIndex(externalHighlightedBoxIndex)
  }, [externalHighlightedBoxIndex])

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImage(img)
      setImageLoaded(true)
    }
    img.onerror = () => {
      console.error("Failed to load image:", imageUrl)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Helper functions for coordinate conversion
  const getDrawDimensions = useCallback(() => {
    if (!canvasRef.current || !image) return null

    const canvas = canvasRef.current
    const imageAspect = image.width / image.height
    const canvasAspect = canvas.width / canvas.height

    let drawWidth = canvas.width
    let drawHeight = canvas.height

    if (imageAspect > canvasAspect) {
      drawHeight = canvas.width / imageAspect
    } else {
      drawWidth = canvas.height * imageAspect
    }

    const drawX = (canvas.width - drawWidth) / 2
    const drawY = (canvas.height - drawHeight) / 2

    return { drawX, drawY, drawWidth, drawHeight, scaleX: drawWidth / image.width, scaleY: drawHeight / image.height }
  }, [image])

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 }

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const canvasCenterX = canvas.width / 2
      const canvasCenterY = canvas.height / 2

      // Get mouse position relative to canvas
      let x = ((screenX - rect.left) * canvas.width) / rect.width
      let y = ((screenY - rect.top) * canvas.height) / rect.height

      // Reverse transformations
      x -= offset.x
      y -= offset.y
      x = (x - canvasCenterX) / scale + canvasCenterX
      y = (y - canvasCenterY) / scale + canvasCenterY

      return { x, y }
    },
    [scale, offset]
  )

  // Convert canvas coordinates to image pixel coordinates
  const canvasToImageCoords = useCallback(
    (canvasX: number, canvasY: number): { x: number; y: number } | null => {
      const dims = getDrawDimensions()
      if (!dims) return null

      const { drawX, drawY, scaleX, scaleY } = dims

      // Convert from canvas coordinates to image pixel coordinates
      const imageX = (canvasX - drawX) / scaleX
      const imageY = (canvasY - drawY) / scaleY

      return { x: imageX, y: imageY }
    },
    [getDrawDimensions],
  )

  const getBoxScreenCoords = useCallback(
    (detection: Detection) => {
      const dims = getDrawDimensions()
      if (!dims) return null

      const { drawX, drawY, scaleX, scaleY } = dims

      const boxX = drawX + detection.x * scaleX - (detection.width * scaleX) / 2
      const boxY = drawY + detection.y * scaleY - (detection.height * scaleY) / 2
      const boxWidth = detection.width * scaleX
      const boxHeight = detection.height * scaleY

      return { boxX, boxY, boxWidth, boxHeight }
    },
    [getDrawDimensions]
  )

  // Check if point is inside a box
  const isPointInBox = useCallback(
    (x: number, y: number, detection: Detection): boolean => {
      const coords = getBoxScreenCoords(detection)
      if (!coords) return false

      const { boxX, boxY, boxWidth, boxHeight } = coords
      return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight
    },
    [getBoxScreenCoords]
  )

  // Get resize handle at point
  const getResizeHandleAtPoint = useCallback(
    (x: number, y: number, detection: Detection): ResizeHandle => {
      const coords = getBoxScreenCoords(detection)
      if (!coords) return null

      const { boxX, boxY, boxWidth, boxHeight } = coords
      const handleSize = 8 / scale

      // Check corners first
      if (Math.abs(x - boxX) < handleSize && Math.abs(y - boxY) < handleSize) return "tl"
      if (Math.abs(x - (boxX + boxWidth)) < handleSize && Math.abs(y - boxY) < handleSize) return "tr"
      if (Math.abs(x - boxX) < handleSize && Math.abs(y - (boxY + boxHeight)) < handleSize) return "bl"
      if (Math.abs(x - (boxX + boxWidth)) < handleSize && Math.abs(y - (boxY + boxHeight)) < handleSize) return "br"

      // Check edges
      if (Math.abs(y - boxY) < handleSize && x > boxX && x < boxX + boxWidth) return "t"
      if (Math.abs(y - (boxY + boxHeight)) < handleSize && x > boxX && x < boxX + boxWidth) return "b"
      if (Math.abs(x - boxX) < handleSize && y > boxY && y < boxY + boxHeight) return "l"
      if (Math.abs(x - (boxX + boxWidth)) < handleSize && y > boxY && y < boxY + boxHeight) return "r"

      return null
    },
    [getBoxScreenCoords, scale]
  )

  // Draw on canvas
  useEffect(() => {
    if (!canvasRef.current || !image || !imageLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match container
    const container = containerRef.current
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Calculate centered position
    const canvasCenterX = canvas.width / 2
    const canvasCenterY = canvas.height / 2

    // Apply transformations
    ctx.translate(canvasCenterX, canvasCenterY)
    ctx.scale(scale, scale)
    ctx.translate(-canvasCenterX, -canvasCenterY)
    ctx.translate(offset.x, offset.y)

    // Calculate image size to fit canvas while maintaining aspect ratio
    const dims = getDrawDimensions()
    if (!dims) return

    const { drawX, drawY, drawWidth, drawHeight, scaleX, scaleY } = dims

    // Draw image
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)

    // Draw bounding boxes
    if (detections && detections.length > 0) {
      detections.forEach((detection, index) => {
        const boxX = drawX + detection.x * scaleX - (detection.width * scaleX) / 2
        const boxY = drawY + detection.y * scaleY - (detection.height * scaleY) / 2
        const boxWidth = detection.width * scaleX
        const boxHeight = detection.height * scaleY

        const isSelected = editMode && selectedBoxIndex === index
        const isHovered = editMode && hoveredBoxIndex === index
        const isHighlighted = !editMode && highlightedBoxIndex === index
        const color = getColorForClass(detection.class)

        // Draw bounding box
        ctx.strokeStyle = color
        ctx.lineWidth = (isSelected ? 4 : isHovered || isHighlighted ? 3.5 : 3) / scale
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

        // Draw selection highlight
        if (isSelected || isHovered) {
          ctx.fillStyle = color + "20" // 20 = ~12% opacity
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
        }

        // Draw white overlay for highlighted box (from detection summary)
        if (isHighlighted) {
          ctx.fillStyle = "rgba(85, 79, 79, 0.5)" // White with 30% opacity
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
        }

        // Draw resize handles if selected
        if (editMode && isSelected) {
          const handleSize = 8 / scale
          ctx.fillStyle = color

          const handles = [
            { x: boxX, y: boxY }, // tl
            { x: boxX + boxWidth, y: boxY }, // tr
            { x: boxX, y: boxY + boxHeight }, // bl
            { x: boxX + boxWidth, y: boxY + boxHeight }, // br
            { x: boxX + boxWidth / 2, y: boxY }, // t
            { x: boxX + boxWidth / 2, y: boxY + boxHeight }, // b
            { x: boxX, y: boxY + boxHeight / 2 }, // l
            { x: boxX + boxWidth, y: boxY + boxHeight / 2 }, // r
          ]

          handles.forEach((handle) => {
            ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
          })
        }

        // Draw label background
        const label = `${detection.class} (${(detection.confidence * 100).toFixed(1)}%)`
        ctx.font = `${14 / scale}px Arial`
        const textMetrics = ctx.measureText(label)
        const textHeight = 14 / scale
        const padding = 4 / scale

        ctx.fillStyle = color + "cc" // cc = ~80% opacity
        ctx.fillRect(boxX, boxY - textHeight - padding * 2, textMetrics.width + padding * 2, textHeight + padding * 2)

        // Draw label text
        ctx.fillStyle = "#ffffff"
        ctx.fillText(label, boxX + padding, boxY - padding)
      })
    }

    // Draw new box being created
    if (isDrawingNewBox && drawStart && drawEnd) {
      const dims = getDrawDimensions()
      if (dims) {
        const { drawX, drawY, scaleX, scaleY } = dims
        
        const x1 = Math.min(drawStart.x, drawEnd.x)
        const y1 = Math.min(drawStart.y, drawEnd.y)
        const x2 = Math.max(drawStart.x, drawEnd.x)
        const y2 = Math.max(drawStart.y, drawEnd.y)
        
        const screenX = drawX + x1 * scaleX
        const screenY = drawY + y1 * scaleY
        const screenWidth = (x2 - x1) * scaleX
        const screenHeight = (y2 - y1) * scaleY
        
        // Draw dotted box
        ctx.strokeStyle = "#00bcd4"
        ctx.lineWidth = 2 / scale
        ctx.setLineDash([5 / scale, 5 / scale])
        ctx.strokeRect(screenX, screenY, screenWidth, screenHeight)
        
        // Semi-transparent fill
        ctx.fillStyle = "#00bcd420"
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight)
        
        // Reset line dash
        ctx.setLineDash([])
      }
    }

    // Restore context state
    ctx.restore()
  }, [image, imageLoaded, scale, offset, detections, editMode, selectedBoxIndex, hoveredBoxIndex, highlightedBoxIndex, getDrawDimensions, isDrawingNewBox, drawStart, drawEnd])

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    // Drawing new box mode
    if (isDrawingNewBox) {
      const coords = canvasToImageCoords(x, y)
      if (coords) {
        setDrawStart(coords)
        setDrawEnd(coords)
      }
      return
    }

    if (editMode && detections.length > 0) {
      // Check if clicking on a box or handle
      for (let i = detections.length - 1; i >= 0; i--) {
        const detection = detections[i]

        // Check for resize handle
        if (selectedBoxIndex === i) {
          const handle = getResizeHandleAtPoint(x, y, detection)
          if (handle) {
            setIsResizingBox(true)
            setResizeHandle(handle)
            return
          }
        }

        // Check if clicking inside box
        if (isPointInBox(x, y, detection)) {
          setSelectedBoxIndex(i)
          setIsDraggingBox(true)

          const coords = getBoxScreenCoords(detection)
          if (coords) {
            setDragOffset({
              x: x - coords.boxX,
              y: y - coords.boxY,
            })
          }
          return
        }
      }

      // Clicked outside all boxes - deselect
      setSelectedBoxIndex(null)
    }

    // Start panning
    setIsPanning(true)
    setPanStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    // Drawing new box mode
    if (isDrawingNewBox && drawStart) {
      const coords = canvasToImageCoords(x, y)
      if (coords) {
        setDrawEnd(coords)
      }
      return
    }

    if (editMode) {
      // Update hover state
      if (!isDraggingBox && !isResizingBox) {
        let foundHover = false
        for (let i = detections.length - 1; i >= 0; i--) {
          if (isPointInBox(x, y, detections[i])) {
            setHoveredBoxIndex(i)
            foundHover = true
            break
          }
        }
        if (!foundHover) {
          setHoveredBoxIndex(null)
        }
      }

      // Handle box dragging
      if (isDraggingBox && selectedBoxIndex !== null) {
        const dims = getDrawDimensions()
        if (!dims) return

        const { drawX, drawY, scaleX, scaleY } = dims
        const detection = detections[selectedBoxIndex]

        // Calculate new center position in image coordinates
        const newBoxX = x - dragOffset.x
        const newBoxY = y - dragOffset.y
        const newCenterX = (newBoxX - drawX) / scaleX + (detection.width / 2)
        const newCenterY = (newBoxY - drawY) / scaleY + (detection.height / 2)

        const updatedDetections = [...detections]
        updatedDetections[selectedBoxIndex] = {
          ...detection,
          x: newCenterX,
          y: newCenterY,
        }
        setDetections(updatedDetections)
        return
      }

      // Handle box resizing
      if (isResizingBox && selectedBoxIndex !== null && resizeHandle) {
        const dims = getDrawDimensions()
        if (!dims) return

        const { drawX, drawY, scaleX, scaleY } = dims
        const detection = detections[selectedBoxIndex]

        // Get current box bounds in image coordinates
        let left = detection.x - detection.width / 2
        let right = detection.x + detection.width / 2
        let top = detection.y - detection.height / 2
        let bottom = detection.y + detection.height / 2

        // Convert mouse position to image coordinates
        const imgX = (x - drawX) / scaleX
        const imgY = (y - drawY) / scaleY

        // Update bounds based on handle
        if (resizeHandle.includes("l")) left = imgX
        if (resizeHandle.includes("r")) right = imgX
        if (resizeHandle.includes("t")) top = imgY
        if (resizeHandle.includes("b")) bottom = imgY

        // Ensure minimum size
        const minSize = 10
        if (right - left < minSize) return
        if (bottom - top < minSize) return

        const updatedDetections = [...detections]
        updatedDetections[selectedBoxIndex] = {
          ...detection,
          x: (left + right) / 2,
          y: (top + bottom) / 2,
          width: right - left,
          height: bottom - top,
        }
        setDetections(updatedDetections)
        return
      }
    }

    // Handle panning
    if (isPanning && !editMode) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    // Finish drawing new box
    if (isDrawingNewBox && drawStart && drawEnd) {
      const x1 = Math.min(drawStart.x, drawEnd.x)
      const y1 = Math.min(drawStart.y, drawEnd.y)
      const x2 = Math.max(drawStart.x, drawEnd.x)
      const y2 = Math.max(drawStart.y, drawEnd.y)
      
      const width = x2 - x1
      const height = y2 - y1
      
      // Only create box if it has minimum size (at least 10x10 pixels)
      if (width > 10 && height > 10) {
        setNewBoxData({
          x: x1 + width / 2, // Center X
          y: y1 + height / 2, // Center Y
          width,
          height,
        })
        setShowNewBoxDialog(true)
      } else {
        // Box too small, reset
        setDrawStart(null)
        setDrawEnd(null)
      }
      return
    }

    setIsPanning(false)
    setIsDraggingBox(false)
    setIsResizingBox(false)
    setResizeHandle(null)
  }

  const handleMouseLeave = () => {
    setIsPanning(false)
    setIsDraggingBox(false)
    setIsResizingBox(false)
    setResizeHandle(null)
    setHoveredBoxIndex(null)
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.5))
  }

  const handleReset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5))
  }

  // Edit mode handlers
  const toggleEditMode = () => {
    if (editMode) {
      setSelectedBoxIndex(null)
      setHoveredBoxIndex(null)
    }
    setEditMode(!editMode)
  }

  const handleSave = () => {
    // Mark edited detections
    const updatedDetections: Detection[] = detections.map((detection, index) => {
      const original = originalDetections[index]
      
      // Check if detection was edited (compare coordinates, size, class)
      if (original && (
        detection.x !== original.x ||
        detection.y !== original.y ||
        detection.width !== original.width ||
        detection.height !== original.height ||
        detection.class !== original.class ||
        detection.confidence !== original.confidence
      )) {
        // Mark as edited if it wasn't already user-added
        const annotationType: Detection["annotationType"] = detection.annotationType === "user_added" ? "user_added" : "user_edited"
        return {
          ...detection,
          annotationType,
          modifiedAt: new Date().toISOString(),
          modifiedBy: "system", // Replace with actual user ID when authentication is implemented
        } as Detection
      }
      
      return detection
    })
    
    if (onDetectionsChange) {
      onDetectionsChange(updatedDetections)
    }
    setEditMode(false)
    setSelectedBoxIndex(null)
    setOriginalDetections(updatedDetections)
  }

  const handleCancel = () => {
    setDetections(initialDetections)
    setEditMode(false)
    setSelectedBoxIndex(null)
  }

  const handleDeleteClick = () => {
    if (selectedBoxIndex !== null) {
      setDetectionToDelete(selectedBoxIndex)
      setShowDeleteDialog(true)
    }
  }

  const handleDeleteConfirm = () => {
    if (detectionToDelete !== null) {
      const newDetections = detections.filter((_, index) => index !== detectionToDelete)
      setDetections(newDetections)
      
      if (onDetectionsChange) {
        onDetectionsChange(newDetections)
      }
      
      setSelectedBoxIndex(null)
      setDetectionToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  const handleStartDrawing = () => {
    setIsDrawingNewBox(true)
    setSelectedBoxIndex(null)
  }

  const handleCancelDrawing = () => {
    setIsDrawingNewBox(false)
    setDrawStart(null)
    setDrawEnd(null)
  }

  const handleConfirmNewBox = () => {
    if (newBoxData) {
      const confidence = parseFloat(newBoxConfidence)
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        alert("Confidence must be a number between 0 and 1")
        return
      }

      const now = new Date().toISOString()
      const newDetection: Detection = {
        detection_id: `manual_${Date.now()}`,
        class: newBoxClass,
        confidence: confidence,
        x: newBoxData.x,
        y: newBoxData.y,
        width: newBoxData.width,
        height: newBoxData.height,
        // FR3.1: Add annotation metadata
        annotationType: "user_added",
        comments: newBoxComments.trim() || undefined,
        createdAt: now,
        createdBy: "system", // Replace with actual user ID when authentication is implemented
        modifiedAt: now,
        modifiedBy: "system",
      }

      const newDetections = [...detections, newDetection]
      setDetections(newDetections)
      setOriginalDetections(newDetections)

      if (onDetectionsChange) {
        onDetectionsChange(newDetections)
      }

      // Reset drawing state
      setShowNewBoxDialog(false)
      setNewBoxData(null)
      setNewBoxComments("")
      setDrawStart(null)
      setDrawEnd(null)
      setIsDrawingNewBox(false)
      setNewBoxClass("faulty")
      setNewBoxConfidence("0.95")
    }
  }

  // Cursor style
  const getCursorStyle = () => {
    if (isDrawingNewBox) return "cursor-crosshair"
    if (editMode) {
      if (isDraggingBox) return "cursor-grabbing"
      if (isResizingBox) {
        if (resizeHandle === "tl" || resizeHandle === "br") return "cursor-nwse-resize"
        if (resizeHandle === "tr" || resizeHandle === "bl") return "cursor-nesw-resize"
        if (resizeHandle === "t" || resizeHandle === "b") return "cursor-ns-resize"
        if (resizeHandle === "l" || resizeHandle === "r") return "cursor-ew-resize"
      }
      if (hoveredBoxIndex !== null) return "cursor-grab"
      return "cursor-default"
    }
    return isPanning ? "cursor-grabbing" : "cursor-grab"
  }

  // Get severity level based on confidence
  const getSeverityLevel = (confidence: number): string => {
    if (confidence >= 0.8) return "Critical"
    if (confidence >= 0.6) return "High"
    if (confidence >= 0.4) return "Medium"
    return "Low"
  }

  const getSeverityColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-red-600"
    if (confidence >= 0.6) return "text-orange-600"
    if (confidence >= 0.4) return "text-yellow-600"
    return "text-blue-600"
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="relative w-full h-[360px] border rounded-md overflow-hidden bg-muted/10">
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${getCursorStyle()}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading image...</p>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {!editMode ? (
            <>
              <Button size="sm" variant="secondary" className="w-9 h-9 p-0" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="w-9 h-9 p-0" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="w-9 h-9 p-0" onClick={handleReset} title="Reset View">
                <RotateCcw className="w-4 h-4" />
              </Button>
              {detections.length > 0 && (
                <Button size="sm" variant="default" className="w-9 h-9 p-0" onClick={toggleEditMode} title="Edit Boxes">
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : isDrawingNewBox ? (
            <>
              <Button size="sm" variant="destructive" className="w-9 h-9 p-0" onClick={handleCancelDrawing} title="Cancel Drawing">
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-9 h-9 p-0 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" 
                onClick={handleStartDrawing} 
                title="Draw New Box"
              >
                <Plus className="w-4 h-4" />
              </Button>
              {selectedBoxIndex !== null && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-9 h-9 p-0 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" 
                  onClick={handleDeleteClick} 
                  title="Delete Selected Detection"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" variant="default" className="w-9 h-9 p-0" onClick={handleSave} title="Save Changes">
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" className="w-9 h-9 p-0" onClick={handleCancel} title="Cancel">
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Edit mode indicator */}
        {editMode && !isDrawingNewBox && (
          <div className="absolute top-2 left-2 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
            Edit Mode: {selectedBoxIndex !== null ? "Move or resize box" : "Click a box to select"}
          </div>
        )}
        
        {/* Drawing mode indicator */}
        {isDrawingNewBox && (
          <div className="absolute top-2 left-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
            Drawing Mode: Click and drag to draw a new bounding box
          </div>
        )}

        {/* Detection count badge */}
        {detections && detections.length > 0 && !editMode && (
          <div className="absolute bottom-2 left-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
            {detections.length} anomal{detections.length === 1 ? "y" : "ies"} detected
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Detection"
        description={
          detectionToDelete !== null && detections[detectionToDelete]
            ? `Are you sure you want to delete this ${detections[detectionToDelete].class} detection? This action cannot be undone.`
            : "Are you sure you want to delete this detection?"
        }
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* New Box Dialog */}
      <Dialog open={showNewBoxDialog} onOpenChange={setShowNewBoxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Detection</DialogTitle>
            <DialogDescription>
              Configure the properties for the new detection bounding box.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class" className="text-right">
                Class
              </Label>
              <Select value={newBoxClass} onValueChange={setNewBoxClass}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faulty">Faulty</SelectItem>
                  <SelectItem value="potentially_faulty">Potentially Faulty</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confidence" className="text-right">
                Confidence
              </Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={newBoxConfidence}
                onChange={(e) => setNewBoxConfidence(e.target.value)}
                className="col-span-3"
                placeholder="0.95"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comments" className="text-right">
                Comments
              </Label>
              <textarea
                id="comments"
                value={newBoxComments}
                onChange={(e) => setNewBoxComments(e.target.value)}
                className="col-span-3 min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                placeholder="Optional notes about this detection..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewBoxDialog(false)
                setNewBoxData(null)
                setDrawStart(null)
                setDrawEnd(null)
                setIsDrawingNewBox(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmNewBox}>Add Detection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Export metadata component separately for use above progress bar
export function DetectionMetadata({ 
  detections, 
  selectedBoxIndex, 
  editMode,
  onSelectDetection,
  highlightedBoxIndex,
  onHighlightDetection
}: {
  detections: Detection[]
  selectedBoxIndex: number | null
  editMode: boolean
  onSelectDetection?: (index: number | null) => void
  highlightedBoxIndex?: number | null
  onHighlightDetection?: (index: number | null) => void
}) {
  const getSeverityLevel = (confidence: number): string => {
    if (confidence >= 0.8) return "Critical"
    if (confidence >= 0.6) return "High"
    if (confidence >= 0.4) return "Medium"
    return "Low"
  }

  const getSeverityColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-red-600"
    if (confidence >= 0.6) return "text-orange-600"
    if (confidence >= 0.4) return "text-yellow-600"
    return "text-blue-600"
  }

  const getColorForClass = (className: string): string => {
    const colors: Record<string, string> = {
      faulty: "#ff0000",
      potentially_faulty: "#ff9800",
      normal: "#00ff00",
      default: "#00bcd4",
    }
    return colors[className.toLowerCase()] || colors.default
  }

  if (detections.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-muted/10 text-center">
        <p className="text-sm text-muted-foreground">No detections available</p>
      </div>
    )
  }

  // Only show selected detection details in edit mode
  if (editMode && selectedBoxIndex !== null && detections[selectedBoxIndex]) {
    // Show selected detection details
    const detection = detections[selectedBoxIndex]
    return (
      <div className="p-4 border rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Selected Detection Details (Edit Mode)</h3>
          {onSelectDetection && (
            <Button size="sm" variant="ghost" onClick={() => onSelectDetection(null)}>
              View All
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Class</p>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getColorForClass(detection.class) }}
              />
              <p className="text-sm font-semibold capitalize">{detection.class.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Severity</p>
            <p className={`text-sm font-bold ${getSeverityColor(detection.confidence)}`}>
              {getSeverityLevel(detection.confidence)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <p className="text-sm font-semibold">{(detection.confidence * 100).toFixed(2)}%</p>
          </div>
          
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Center (X, Y)</p>
            <p className="text-sm font-mono">({Math.round(detection.x)}, {Math.round(detection.y)})</p>
          </div>
          
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Size (W × H)</p>
            <p className="text-sm font-mono">{Math.round(detection.width)} × {Math.round(detection.height)}</p>
          </div>
          
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Area</p>
            <p className="text-sm font-mono">
              {Math.round(detection.width * detection.height).toLocaleString()}px²
            </p>
          </div>
        </div>
        
        {/* Annotation Metadata (FR3.1) */}
        {(detection.annotationType || detection.comments || detection.createdAt) && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Annotation Information</p>
            <div className="space-y-1 text-xs">
              {detection.annotationType && (
                <div className="flex gap-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Type:</span>
                  <span className="text-blue-900 dark:text-blue-100 capitalize">
                    {detection.annotationType.replace('_', ' ')}
                  </span>
                </div>
              )}
              {detection.createdAt && (
                <div className="flex gap-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Created:</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {new Date(detection.createdAt).toLocaleString()}
                    {detection.createdBy && ` by ${detection.createdBy}`}
                  </span>
                </div>
              )}
              {detection.modifiedAt && detection.modifiedAt !== detection.createdAt && (
                <div className="flex gap-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Modified:</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {new Date(detection.modifiedAt).toLocaleString()}
                    {detection.modifiedBy && ` by ${detection.modifiedBy}`}
                  </span>
                </div>
              )}
              {detection.comments && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Comments:</span>
                  <p className="mt-1 text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{detection.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-muted-foreground">
          ⚠️ Values update in real-time as you edit the bounding box
        </div>
      </div>
    )
  }

  // Show all detections grid
  return (
    <div className="p-4 border rounded-md bg-card">
      <h3 className="font-semibold text-sm mb-3">
        Detection Summary ({detections.length} anomal{detections.length > 1 ? 'ies' : 'y'} detected)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {detections.map((detection, index) => {
          const isHighlighted = highlightedBoxIndex === index
          return (
          <div
            key={detection.detection_id}
            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              isHighlighted 
                ? 'border-primary shadow-lg bg-primary/5' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => {
              if (onHighlightDetection) {
                // Toggle highlight: if already highlighted, unhighlight it
                onHighlightDetection(isHighlighted ? null : index)
              }
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getColorForClass(detection.class) }}
                />
                <span className="text-xs font-medium capitalize">
                  {detection.class.replace('_', ' ')}
                </span>
              </div>
              <span className={`text-xs font-bold ${getSeverityColor(detection.confidence)}`}>
                {(detection.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Annotation Type Badge (FR3.1) */}
            {detection.annotationType && (
              <div className="mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  detection.annotationType === 'ai_detected' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  detection.annotationType === 'user_added' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  detection.annotationType === 'user_edited' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {detection.annotationType.replace('_', ' ')}
                </span>
              </div>
            )}
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Position:</span>
                <span className="font-mono">({Math.round(detection.x)}, {Math.round(detection.y)})</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-mono">{Math.round(detection.width)}×{Math.round(detection.height)}</span>
              </div>
              <div className="flex justify-between">
                <span>Area:</span>
                <span className="font-mono">{Math.round(detection.width * detection.height).toLocaleString()}px²</span>
              </div>
              {detection.comments && (
                <div className="pt-2 border-t mt-2">
                  <span className="font-medium">Note:</span>
                  <p className="mt-1 text-xs line-clamp-2">{detection.comments}</p>
                </div>
              )}
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
