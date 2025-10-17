"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { generateTrendDataFromDB, formatCurrency } from "@/lib/parquet-utils"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

interface ParquetTrendChartProps {
  connection: AsyncDuckDBConnection
}

const chartConfig = {
  trips: {
    label: "Trips",
    color: "var(--chart-1)",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ParquetTrendChart({ connection }: ParquetTrendChartProps) {
  const isMobile = useIsMobile()
  const [metric, setMetric] = React.useState<"trips" | "revenue">("trips")
  const [timeRange, setTimeRange] = React.useState("all")
  const [trendData, setTrendData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadTrendData() {
      setLoading(true)
      const data = await generateTrendDataFromDB(connection, 90)
      setTrendData(data)
      setLoading(false)
    }
    loadTrendData()
  }, [connection])

  const filteredChartData = React.useMemo(() => {
    let filtered = trendData

    if (timeRange !== "all") {
      const days = Number.parseInt(timeRange)
      filtered = trendData.slice(-days)
    }

    return filtered.map((item) => ({
      date: item.date,
      value: metric === "trips" ? item.trips : item.revenue,
    }))
  }, [trendData, timeRange, metric])

  React.useEffect(() => {
    if (isMobile && timeRange === "all") {
      setTimeRange("7")
    }
  }, [isMobile, timeRange])

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {metric === "trips" ? "Number of trips" : "Revenue"} over time
          </span>
          <span className="@[540px]/card:hidden">{metric === "trips" ? "Trips" : "Revenue"} trend</span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Select value={metric} onValueChange={(value: "trips" | "revenue") => setMetric(value)}>
              <SelectTrigger className="w-32" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trips">Trips</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="all">All Data</ToggleGroupItem>
              <ToggleGroupItem value="30">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredChartData}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={metric === "trips" ? "var(--color-trips)" : "var(--color-revenue)"}
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor={metric === "trips" ? "var(--color-trips)" : "var(--color-revenue)"}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (metric === "revenue") {
                  return formatCurrency(value).replace(".00", "")
                }
                return value.toLocaleString()
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value) => {
                    if (metric === "revenue") {
                      return formatCurrency(value as number)
                    }
                    return (value as number).toLocaleString()
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="value"
              type="natural"
              fill="url(#fillValue)"
              stroke={metric === "trips" ? "var(--color-trips)" : "var(--color-revenue)"}
              name={metric === "trips" ? "Trips" : "Revenue"}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
