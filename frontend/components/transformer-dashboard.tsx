"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TransformerList } from "@/components/transformers/transformer-list"
import { InspectionList } from "@/components/inspections/inspection-list"
import { TransformerDetails } from "@/components/transformers/transformer-details"
import { InspectionDetails } from "@/components/inspections/inspection-details"

export type ViewType = "transformers" | "inspections" | "transformer-details" | "inspection-details"

export interface Transformer {
  id: string
  transformerNo: string
  poleNo: string
  region: string
  type: "Distribution" | "Bulk"
  capacity: number
  noOfFeeders: number
  locationDetails: string
}

export interface Inspection {
  id: string
  inspectionNo: string
  transformerId: string
  transformerNo: string
  inspectedDate: string
  maintenanceDate?: string
  status: "In Progress" | "Pending" | "Completed"
  inspectedBy: string
  weatherCondition?: "Sunny" | "Cloudy" | "Rainy"
  thermalImages: ThermalImage[]
}

export interface ThermalImage {
  id: string
  type: "Baseline" | "Maintenance"
  url: string
  uploadDate: string
  uploader: string
  weatherCondition?: "Sunny" | "Cloudy" | "Rainy"
  temperature?: number
  anomalies?: Array<{
    x: number
    y: number
    width: number
    height: number
    temperature: number
  }>
}

export function TransformerDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("transformers")
  const [selectedTransformerId, setSelectedTransformerId] = useState<string | null>(null)
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)

  const handleViewChange = (view: ViewType, id?: string) => {
    setCurrentView(view)
    if (view === "transformer-details" && id) {
      setSelectedTransformerId(id)
    } else if (view === "inspection-details" && id) {
      setSelectedInspectionId(id)
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case "transformers":
        return <TransformerList onViewTransformer={(id) => handleViewChange("transformer-details", id)} />
      case "inspections":
        return <InspectionList onViewInspection={(id) => handleViewChange("inspection-details", id)} />
      case "transformer-details":
        return selectedTransformerId ? (
          <TransformerDetails transformerId={selectedTransformerId} onBack={() => setCurrentView("transformers")} />
        ) : null
      case "inspection-details":
        return selectedInspectionId ? (
          <InspectionDetails inspectionId={selectedInspectionId} onBack={() => setCurrentView("inspections")} />
        ) : null
      default:
        return <TransformerList onViewTransformer={(id) => handleViewChange("transformer-details", id)} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
