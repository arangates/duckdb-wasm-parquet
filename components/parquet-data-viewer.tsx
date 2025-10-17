"use client"
import { IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ParquetStatsCards } from "@/components/parquet-stats-cards"
import { ParquetTrendChart } from "@/components/parquet-trend-chart"
import { ParquetDataTable } from "@/components/parquet-data-table"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

interface ParquetDataViewerProps {
  connection: AsyncDuckDBConnection
  onReset: () => void
}

export function ParquetDataViewer({ connection, onReset }: ParquetDataViewerProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold">Data Analysis</h2>
          <p className="text-sm text-muted-foreground">Powered by DuckDB-WASM</p>
        </div>
        <Button variant="outline" onClick={onReset}>
          <IconRefresh />
          Upload New File
        </Button>
      </div>
      <ParquetStatsCards connection={connection} />
      <div className="px-4 lg:px-6">
        <ParquetTrendChart connection={connection} />
      </div>
      <ParquetDataTable connection={connection} />
    </>
  )
}
