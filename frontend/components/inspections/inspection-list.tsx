"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, Eye, Calendar, User, Pencil, Trash2 } from "lucide-react"
import { AddInspectionDialog } from "./add-inspection-dialog"
import { EditInspectionDialog } from "./edit-inspection-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api"
import type { InspectionData } from "@/lib/api"

interface InspectionListProps {
  onViewInspection: (id: string) => void
}

export function InspectionList({ onViewInspection }: InspectionListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<InspectionData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [inspections, setInspections] = useState<InspectionData[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInspections = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getInspections()
      if (res.success) {
        setInspections(res.data)
      } else {
        setError(res.message || "Failed to fetch inspections.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch inspections.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInspections()
  }, [])

  // Refetch when dialogs close
  useEffect(() => {
    if (!showAddDialog && !showEditDialog) {
      fetchInspections()
    }
  }, [showAddDialog, showEditDialog])

  const handleEdit = (inspection: InspectionData) => {
    setSelectedInspection(inspection)
    setShowEditDialog(true)
  }

  const handleDeleteClick = (inspection: InspectionData) => {
    setSelectedInspection(inspection)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedInspection?.id) return
    
    setDeleting(true)
    try {
      const res = await api.deleteInspection(selectedInspection.id)
      if (res.success) {
        await fetchInspections()
        setShowDeleteDialog(false)
        setSelectedInspection(null)
      } else {
        setError(res.message || "Failed to delete inspection.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete inspection.")
    } finally {
      setDeleting(false)
    }
  }



  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection?.transformer?.transformerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection?.transformer?.transformerNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || inspection.status?.toLowerCase().replace(" ", "") === statusFilter
    return matchesSearch && matchesStatus
  })

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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Inspections</h1>
          <p className="text-muted-foreground mt-1">Monitor and track transformer inspections</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Inspection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transformer Inspections</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by transformer no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No inspections found.</div>
            ) : (
              filteredInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{inspection?.transformer?.transformerNo}</span>
                      <Badge className={getStatusColor(inspection.status)}>{inspection.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Inspection: {inspection.inspectionNo}</span>
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onViewInspection(inspection.id!)} className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(inspection)} className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(inspection)} 
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddInspectionDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      
      {selectedInspection && (
        <>
          <EditInspectionDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog}
            inspection={selectedInspection}
            onSuccess={fetchInspections}
          />
          
          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Inspection"
            description={`Are you sure you want to delete inspection "${selectedInspection.inspectionNo}"? This action cannot be undone and will also delete all associated thermal images.`}
            onConfirm={handleDeleteConfirm}
            confirmText={deleting ? "Deleting..." : "Delete"}
            variant="destructive"
          />
        </>
      )}
    </div>
  )
}
