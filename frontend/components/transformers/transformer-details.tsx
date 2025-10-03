"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Eye, Zap, Calendar, User, Image as ImageIcon, Pencil, Trash2 } from "lucide-react"
import { AddInspectionDialog } from "@/components/inspections/add-inspection-dialog"
import { EditTransformerDialog } from "./edit-transformer-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { InspectionDetails } from "@/components/inspections/inspection-details"
import { BaselineImageCard } from "./baseline-image-card"
import { api } from "@/lib/api";
import type { TransformerData, InspectionData } from "@/lib/api"
import { useRouter } from "next/navigation"


interface TransformerDetailsProps {
  transformerId: string
  onBack: () => void
}

export function TransformerDetails({ transformerId, onBack }: TransformerDetailsProps) {
  const [showAddInspection, setShowAddInspection] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [transformer, setTransformer] = useState<TransformerData | null>(null)
  const [inspections, setInspections] = useState<InspectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tRes, iRes] = await Promise.all([
        api.getTransformers().then(res => ({...res, data: res.data.find(t => t.id === transformerId)})),
        api.getInspections(transformerId),
      ])
      if (tRes.success && tRes.data) setTransformer(tRes.data);
      else setError(tRes.message || "Failed to load transformer");
      if (iRes.success) setInspections(iRes.data);
    } catch (e: any) {
      setError(e.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [transformerId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operational":
        return "bg-green-100 text-green-800 border-green-200"
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Offline":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getInspectionStatusColor = (status: string) => {
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

  // if (selectedInspectionId) {
  //   return (
  //     <InspectionDetails inspectionId={selectedInspectionId} onBack={() => setSelectedInspectionId(null)} />
  //   )
  // }

  // Refresh when dialogs close
  useEffect(() => {
    if (!showAddInspection && !showEditDialog) {
      fetchData();
    }
  }, [showAddInspection, showEditDialog])

  const handleDeleteConfirm = async () => {
    if (!transformer?.id) return
    
    setDeleting(true)
    try {
      const res = await api.deleteTransformer(transformer.id)
      if (res.success) {
        onBack() // Go back to list after deleting
      } else {
        setError(res.message || "Failed to delete transformer.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete transformer.")
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
            <h1 className="text-3xl font-bold">{transformer?.transformerNo || "Transformer"}</h1>
            <p className="text-muted-foreground">{transformer?.locationDetails || ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit Transformer
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
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Transformer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={getStatusColor(transformer?.status || "Operational")}>
                {transformer?.status || "Operational"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pole No</span>
              <span className="font-medium">{transformer?.poleNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium">{transformer?.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">{transformer?.capacity} kVA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{transformer?.type}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">No. of Feeders</span>
              <div className="font-medium">{transformer?.noOfFeeders||0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transformer Inspections</CardTitle>
              <Button onClick={() => setShowAddInspection(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Inspection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">{error}</div>
              ) : inspections.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No inspections yet.</div>
              ) : (
              inspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{inspection.inspectionNo}</span>
                      <Badge className={getInspectionStatusColor(inspection.status)}>{inspection.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(inspection.inspectedDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {inspection.inspectedBy}
                      </span>
                      {inspection.maintenanceDate && <span>Maintenance: {formatDate(inspection.maintenanceDate)}</span>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => router.push(`/inspections/${inspection.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Baseline Images Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Baseline Thermal Images
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload baseline thermal images for different weather conditions to compare with maintenance inspections
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {transformer && (
              <>
                <BaselineImageCard
                  transformerId={transformer.id!}
                  weatherCondition="Sunny"
                  imageUrl={transformer.sunnyBaselineImageUrl}
                  onUploadSuccess={fetchData}
                />
                <BaselineImageCard
                  transformerId={transformer.id!}
                  weatherCondition="Cloudy"
                  imageUrl={transformer.cloudyBaselineImageUrl}
                  onUploadSuccess={fetchData}
                />
                <BaselineImageCard
                  transformerId={transformer.id!}
                  weatherCondition="Rainy"
                  imageUrl={transformer.rainyBaselineImageUrl}
                  onUploadSuccess={fetchData}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AddInspectionDialog
        open={showAddInspection}
        onOpenChange={setShowAddInspection}
        transformerNo={transformer?.transformerNo}
      />
      
      {transformer && (
        <>
          <EditTransformerDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog}
            transformer={transformer}
            onSuccess={fetchData}
          />
          
          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Transformer"
            description={`Are you sure you want to delete transformer "${transformer.transformerNo}"? This action cannot be undone and will also delete all ${inspections.length} associated inspection(s) and thermal images.`}
            onConfirm={handleDeleteConfirm}
            confirmText={deleting ? "Deleting..." : "Delete"}
            variant="destructive"
          />
        </>
      )}
    </div>
  )
}
