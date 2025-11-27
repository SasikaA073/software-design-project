"use client"

import { AppShell } from "@/components/layout/app-shell"
import { MaintenanceRecordDetails } from "@/components/maintenance-records/maintenance-record-details"
import { useRouter, useParams } from "next/navigation"

export default function MaintenanceRecordPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  return (
    <AppShell>
      <MaintenanceRecordDetails 
        recordId={id}
        onBack={() => router.back()}
        onEdit={() => router.push(`/maintenance-records/${id}/edit`)}
      />
    </AppShell>
  )
}
