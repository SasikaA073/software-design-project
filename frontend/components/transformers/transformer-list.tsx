"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, Eye, MapPin, Zap } from "lucide-react"
import { AddTransformerDialog } from "./add-transformer-dialog"
import { AlertsPanel } from "@/components/alerts/alerts-panel"
import type { Transformer } from "@/components/transformer-dashboard"
import { api, TransformerData } from "@/lib/api";


interface TransformerListProps {
  onViewTransformer: (id: string) => void
}




export function TransformerList({ onViewTransformer }: TransformerListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [Transformers, setTransformers] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(false)
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

  // Refetch when dialog closes (after add)
  useEffect(() => {
    if (!showAddDialog) {
      fetchTransformers()
    }
  }, [showAddDialog])

  const filteredTransformers = Transformers.filter((transformer) => {
    const matchesSearch =
      transformer.transformerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformer.region.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = true;
    return matchesSearch && matchesStatus
  })



  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {loading && <div className="text-muted-foreground">Loading transformers...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="lg:col-span-3 space-y-6">
          <Card>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTransformer(transformer.id)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AlertsPanel />
        </div>
      </div>

      <AddTransformerDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
