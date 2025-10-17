"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateStatsFromDB, formatCurrency, formatNumber, formatPercentage } from "@/lib/parquet-utils"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

interface ParquetStatsCardsProps {
  connection: AsyncDuckDBConnection
}

export function ParquetStatsCards({ connection }: ParquetStatsCardsProps) {
  const [stats, setStats] = React.useState({
    totalRecords: 0,
    totalRevenue: 0,
    averageFare: 0,
    averageDistance: 0,
    averagePassengers: 0,
    totalTrips: 0,
    revenueChange: 0,
    tripsChange: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadStats() {
      setLoading(true)
      const data = await calculateStatsFromDB(connection)
      setStats(data)
      setLoading(false)
    }
    loadStats()
  }, [connection])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl">--</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.totalRevenue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.revenueChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(stats.revenueChange)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.revenueChange >= 0 ? "Trending up" : "Trending down"} this period{" "}
            {stats.revenueChange >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Total fare amount collected</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Trips</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.totalTrips)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.tripsChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(stats.tripsChange)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.tripsChange >= 0 ? "Growth in trips" : "Decline in trips"}{" "}
            {stats.tripsChange >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Number of completed rides</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Fare</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.averageFare)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Per Trip
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Average revenue per ride <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Mean fare across all trips</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Distance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.averageDistance.toFixed(2)} mi
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Per Trip
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Average trip length <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Mean distance traveled</div>
        </CardFooter>
      </Card>
    </div>
  )
}
