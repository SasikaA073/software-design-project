"use client"

import { AppShell } from "@/components/layout/app-shell"
import { InspectionList } from "@/components/inspections/inspection-list"
import { useRouter } from "next/navigation"

export default function InspectionsPage() {
  const router = useRouter()
  return (
    <AppShell>
      <InspectionList onViewInspection={(id) => router.push(`/inspections/${id}`)} />
    </AppShell>
  )
}
