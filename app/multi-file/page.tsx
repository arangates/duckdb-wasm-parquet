"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { getDuckDBConnection } from "@/lib/duckdb-client"
import { MultiFileAnalysis } from "@/components/multi-file-analysis"

export default function MultiFilePage() {
  const [connection, setConnection] = useState<AsyncDuckDBConnection | null>(null)

  useEffect(() => {
    const initConnection = async () => {
      const conn = await getDuckDBConnection()
      setConnection(conn)
    }
    initConnection()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Multi-File Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Load multiple parquet files and perform joins, unions, and cross-file analysis
        </p>
      </div>

      <MultiFileAnalysis connection={connection} />
    </div>
  )
}
