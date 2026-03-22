import { TrendingDown, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: number
  momPercent?: number | null
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

export function StatCard({ title, value, momPercent }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{formatVND(value)}</p>
        <div className="mt-2">
          {momPercent == null ? (
            <span className="text-xs text-muted-foreground">No prior data</span>
          ) : momPercent >= 0 ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp className="h-3.5 w-3.5" />
              +{momPercent.toFixed(1)}%
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600">
              <TrendingDown className="h-3.5 w-3.5" />
              {momPercent.toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
