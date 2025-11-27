"use client"

import { AppShell } from "@/components/layout/app-shell"
import { MaintenanceRecordForm } from "@/components/maintenance-records/maintenance-record-form"
import { useRouter, useParams } from "next/navigation"

export default function EditMaintenanceRecordPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const handleSuccess = () => {
    router.push(`/maintenance-records/${id}`)
  }
  
  return (
    <AppShell>
      <MaintenanceRecordForm 
        recordId={id}
        onSuccess={handleSuccess}
      />
    </AppShell>
  )
}
