import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, ClipboardList } from "lucide-react"

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Quick access to transformers and inspections</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Transformers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Manage and monitor all registered transformers.</p>
              <Button asChild>
                <Link href="/transformers">Go to Transformers</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Inspections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Review inspection timelines and thermal analyses.</p>
              <Button asChild variant="secondary">
                <Link href="/inspections">Go to Inspections</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

