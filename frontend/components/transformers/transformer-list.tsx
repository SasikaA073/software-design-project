"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, Eye, MapPin, Zap, Pencil, Trash2 } from "lucide-react"
import { AddTransformerDialog } from "./add-transformer-dialog"
import { EditTransformerDialog } from "./edit-transformer-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Transformer } from "@/components/transformer-dashboard"
import { api } from "@/lib/api"
import type { TransformerData } from "@/lib/api"

interface TransformerListProps {
  onViewTransformer: (id: string) => void
}

export function TransformerList({ onViewTransformer }: TransformerListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTransformer, setSelectedTransformer] = useState<TransformerData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [Transformers, setTransformers] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch transformers from Supabase
  const fetchTransformers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getTransformers()
      if (res.success) {
        setTransformers(res.data as unknown as Transformer[])
      } else {
        setError(res.message || "Failed to fetch transformers.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch transformers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransformers()
  }, [])

  // Refetch when dialog closes (after add/edit)
  useEffect(() => {
    if (!showAddDialog && !showEditDialog) {
      fetchTransformers()
    }
  }, [showAddDialog, showEditDialog])

  const handleEdit = (transformer: Transformer) => {
    setSelectedTransformer(transformer as TransformerData)
    setShowEditDialog(true)
  }

  const handleDeleteClick = (transformer: Transformer) => {
    setSelectedTransformer(transformer as TransformerData)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTransformer?.id) return
    
    setDeleting(true)
    try {
      const res = await api.deleteTransformer(selectedTransformer.id)
      if (res.success) {
        await fetchTransformers()
        setShowDeleteDialog(false)
        setSelectedTransformer(null)
      } else {
        setError(res.message || "Failed to delete transformer.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete transformer.")
    } finally {
      setDeleting(false)
    }
  }

  const filteredTransformers = Transformers.filter((transformer) => {
    const matchesSearch =
      transformer.transformerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformer.region.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = true
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transformers</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your transformer network</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Transformer
        </Button>
      </div>

      {/* Transformer List Full Width */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Total Transformers: {filteredTransformers.length}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search transformers..."
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
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {loading && <div className="text-muted-foreground">Loading transformers...</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {filteredTransformers.map((transformer) => (
              <div
                key={transformer.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{transformer.transformerNo}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Pole: {transformer.poleNo}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {transformer.region}
                      </span>
                      <span>{transformer.type}</span>
                      <span>{transformer.capacity} kVA</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewTransformer(transformer.id)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(transformer)}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(transformer)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddTransformerDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      
      {selectedTransformer && (
        <>
          <EditTransformerDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog}
            transformer={selectedTransformer}
            onSuccess={fetchTransformers}
          />
          
          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Transformer"
            description={`Are you sure you want to delete transformer "${selectedTransformer.transformerNo}"? This action cannot be undone and will also delete all associated inspections and thermal images.`}
            onConfirm={handleDeleteConfirm}
            confirmText={deleting ? "Deleting..." : "Delete"}
            variant="destructive"
          />
        </>
      )}
    </div>
  )
}
