"use client"

import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { TransformerDetails } from "@/components/transformers/transformer-details"

export default function TransformerDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string

  return (
    <AppShell>
      {id && <TransformerDetails transformerId={id} onBack={() => router.push("/transformers")} />}
    </AppShell>
  )
}
