"use client"

import { AppShell } from "@/components/layout/app-shell"
import { TransformerRecordHistory } from "@/components/maintenance-records/transformer-record-history"
import { useRouter, useParams } from "next/navigation"

export default function TransformerRecordHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const transformerId = params.transformerId as string
  
  return (
    <AppShell>
      <TransformerRecordHistory 
        transformerId={transformerId}
        onViewRecord={(id) => router.push(`/maintenance-records/${id}`)}
        onBack={() => router.back()}
      />
    </AppShell>
  )
}
