"use client"
import { IconRefresh, IconDatabase, IconFileTypeCsv, IconTable } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ParquetStatsCards } from "@/components/parquet-stats-cards"
import { ParquetTrendChart } from "@/components/parquet-trend-chart"
import { ParquetDataTable } from "@/components/parquet-data-table"
import { ParquetQueryInterface } from "@/components/parquet-query-interface"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

interface ParquetDataViewerProps {
  connection: AsyncDuckDBConnection
  fileMetadata: {
    name: string
    size: number
    rowCount: number
  } | null
  onReset: () => void
}

export function ParquetDataViewer({ connection, fileMetadata, onReset }: ParquetDataViewerProps) {
  return (
    <>
      <div className="px-4 lg:px-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconFileTypeCsv className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{fileMetadata?.name || "Parquet File"}</h1>
                <p className="text-sm text-muted-foreground">Powered by DuckDB-WASM • SQL Analytics Engine</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={onReset}>
            <IconRefresh className="size-4" />
            Upload New File
          </Button>
        </div>

        {fileMetadata && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-chart-1/10 p-2">
                    <IconDatabase className="size-5 text-[hsl(var(--chart-1))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                    <p className="text-2xl font-semibold">{fileMetadata.rowCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-chart-2/10 p-2">
                    <IconFileTypeCsv className="size-5 text-[hsl(var(--chart-2))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">File Size</p>
                    <p className="text-2xl font-semibold">{(fileMetadata.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-chart-3/10 p-2">
                    <IconTable className="size-5 text-[hsl(var(--chart-3))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="text-2xl font-semibold">Parquet</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-2" />

      <div className="px-4 lg:px-6">
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Key metrics and statistics from your data</p>
        </div>
      </div>

      <ParquetStatsCards connection={connection} />

      <div className="px-4 lg:px-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Trends</h2>
          <p className="text-sm text-muted-foreground">Visualize data patterns over time</p>
        </div>
        <ParquetTrendChart connection={connection} />
      </div>

      <Separator className="my-2" />

      <div className="px-4 lg:px-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">SQL Query</h2>
          <p className="text-sm text-muted-foreground">Run custom SQL queries on your data</p>
        </div>
        <ParquetQueryInterface connection={connection} />
      </div>

      <Separator className="my-2" />

      <div className="px-4 lg:px-6 mb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Data Table</h2>
          <p className="text-sm text-muted-foreground">Browse, filter, and sort all records</p>
        </div>
      </div>

      <ParquetDataTable connection={connection} />
    </>
  )
}
