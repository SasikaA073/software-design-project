"use client"

import { AppShell } from "@/components/layout/app-shell"
import { MaintenanceRecordForm } from "@/components/maintenance-records/maintenance-record-form"
import { useRouter } from "next/navigation"

export default function CreateMaintenanceRecordPage() {
  const router = useRouter()
  
  const handleSuccess = () => {
    router.push("/maintenance-records")
  }
  
  return (
    <AppShell>
      <MaintenanceRecordForm onSuccess={handleSuccess} />
    </AppShell>
  )
}
