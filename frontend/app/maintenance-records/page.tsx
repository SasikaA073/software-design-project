"use client"

import { AppShell } from "@/components/layout/app-shell"
import { MaintenanceRecordsList } from "@/components/maintenance-records/maintenance-records-list"
import { useRouter } from "next/navigation"

export default function MaintenanceRecordsPage() {
  const router = useRouter()
  
  return (
    <AppShell>
      <MaintenanceRecordsList 
        onViewRecord={(id) => router.push(`/maintenance-records/${id}`)}
        onCreateRecord={() => router.push("/maintenance-records/create")}
      />
    </AppShell>
  )
}
