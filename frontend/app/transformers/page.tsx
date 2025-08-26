"use client"

import { AppShell } from "@/components/layout/app-shell"
import { TransformerList } from "@/components/transformers/transformer-list"
import { useRouter } from "next/navigation"

export default function TransformersPage() {
  const router = useRouter()
  return (
    <AppShell>
      <TransformerList onViewTransformer={(id) => router.push(`/transformers/${id}`)} />
    </AppShell>
  )
}
