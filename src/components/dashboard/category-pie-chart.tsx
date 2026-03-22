'use client';

import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface CategoryPieChartProps {
  data: { category: string; total: number }[]
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No expenses in this period
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => a.category.localeCompare(b.category))

  const chartConfig: ChartConfig = Object.fromEntries(
    sorted.map((item, index) => [
      item.category,
      {
        label: item.category,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ])
  )

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-64">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
        <Pie
          data={sorted}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
        >
          {sorted.map((item, index) => (
            <Cell
              key={item.category}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
