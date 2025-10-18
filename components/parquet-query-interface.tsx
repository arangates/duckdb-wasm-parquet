"use client"

import * as React from "react"
import { IconPlayerPlay, IconDownload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

interface ParquetQueryInterfaceProps {
  connection: AsyncDuckDBConnection
}

export function ParquetQueryInterface({ connection }: ParquetQueryInterfaceProps) {
  const [query, setQuery] = React.useState("SELECT * FROM parquet_data LIMIT 10")
  const [results, setResults] = React.useState<any[] | null>(null)
  const [columns, setColumns] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const executeQuery = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await connection.query(query)
      const data = result.toArray()

      if (data.length > 0) {
        setColumns(Object.keys(data[0]))
      } else {
        setColumns([])
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message || "Failed to execute query")
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    if (!results || results.length === 0) return

    const csv = [
      columns.join(","),
      ...results.map((row) => columns.map((col) => JSON.stringify(row[col] ?? "")).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query-results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="font-mono text-sm min-h-[120px] resize-none"
            />
            <div className="flex items-center gap-2">
              <Button onClick={executeQuery} disabled={loading}>
                <IconPlayerPlay className="size-4" />
                {loading ? "Executing..." : "Run Query"}
              </Button>
              {results && results.length > 0 && (
                <Button variant="outline" onClick={exportResults}>
                  <IconDownload className="size-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">{error}</div>}

          {results && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {results.length} row{results.length !== 1 ? "s" : ""} returned
                </p>
              </div>
              {results.length > 0 ? (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          {columns.map((col) => (
                            <TableHead key={col} className="font-semibold">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((row, idx) => (
                          <TableRow key={idx}>
                            {columns.map((col) => (
                              <TableCell key={col} className="font-mono text-xs">
                                {String(row[col] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
