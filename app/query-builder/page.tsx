"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { getDuckDBConnection } from "@/lib/duckdb-client"
import { QueryBuilder } from "@/components/query-builder"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function QueryBuilderPage() {
  const [connection, setConnection] = useState<AsyncDuckDBConnection | null>(null)
  const [hasData, setHasData] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkData = async () => {
      try {
        const conn = await getDuckDBConnection()
        setConnection(conn)

        // Check if parquet_data table exists
        const result = await conn.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = 'parquet_data'
        `)
        const count = Number(result.toArray()[0].count)
        setHasData(count > 0)
      } catch (error) {
        console.error("[v0] Error checking data:", error)
        setHasData(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkData()
  }, [])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Initializing query builder...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription className="mt-2">
            You need to upload a parquet file before you can run queries.
            <div className="mt-4">
              <Button onClick={() => router.push("/parquet-viewer")}>Upload Parquet File</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Query Builder</h1>
        <p className="text-muted-foreground mt-2">Write and execute SQL queries against your parquet data</p>
      </div>

      <QueryBuilder connection={connection} />
    </div>
  )
}
