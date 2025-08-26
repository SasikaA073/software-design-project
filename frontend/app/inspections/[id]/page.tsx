"use client"

import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { InspectionDetails } from "@/components/inspections/inspection-details"

export default function InspectionDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string

  return (
    <AppShell>
      {id && <InspectionDetails inspectionId={id} onBack={() => router.push("/inspections")} />}
    </AppShell>
  )
}
