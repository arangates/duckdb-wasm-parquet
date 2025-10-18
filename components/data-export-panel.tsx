"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dataExport, type ExportConfig } from "@/lib/data-export"
import { useToast } from "@/hooks/use-toast"
import { Download, FileJson, FileText, Database, Share2, Copy, CheckCircle2 } from "lucide-react"

interface DataExportPanelProps {
  connection: AsyncDuckDBConnection | null
}

export function DataExportPanel({ connection }: DataExportPanelProps) {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [tableInfo, setTableInfo] = useState<{
    rowCount: number
    columns: Array<{ name: string; type: string }>
  } | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [whereClause, setWhereClause] = useState("")
  const [limit, setLimit] = useState<number | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)
  const [shareableSQL, setShareableSQL] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (connection) {
      loadTables()
    }
  }, [connection])

  useEffect(() => {
    if (connection && selectedTable) {
      loadTableInfo(selectedTable)
    }
  }, [connection, selectedTable])

  useEffect(() => {
    if (selectedTable) {
      const config: ExportConfig = {
        tableName: selectedTable,
        format: "csv",
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        whereClause: whereClause || undefined,
        limit,
      }
      setShareableSQL(dataExport.generateShareableSQL(config))
    }
  }, [selectedTable, selectedColumns, whereClause, limit])

  const loadTables = async () => {
    if (!connection) return
    try {
      const result = await connection.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'main'
        ORDER BY table_name
      `)
      const tableList = result.toArray().map((row) => row.table_name as string)
      setTables(tableList)
    } catch (error) {
      console.error("[v0] Error loading tables:", error)
    }
  }

  const loadTableInfo = async (tableName: string) => {
    if (!connection) return
    try {
      const info = await dataExport.getTableInfo(connection, tableName)
      setTableInfo(info)
      setSelectedColumns([])
    } catch (error) {
      console.error("[v0] Error loading table info:", error)
    }
  }

  const handleExport = async (format: "csv" | "json" | "parquet") => {
    if (!connection || !selectedTable) return

    setIsExporting(true)
    try {
      const config: ExportConfig = {
        tableName: selectedTable,
        format,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        whereClause: whereClause || undefined,
        limit,
      }

      let blob: Blob
      let extension: string

      switch (format) {
        case "csv":
          blob = await dataExport.exportToCSV(connection, config)
          extension = "csv"
          break
        case "json":
          blob = await dataExport.exportToJSON(connection, config)
          extension = "json"
          break
        case "parquet":
          blob = await dataExport.exportToParquet(connection, config)
          extension = "parquet"
          break
      }

      const filename = `${selectedTable}_export_${Date.now()}.${extension}`
      dataExport.downloadBlob(blob, filename)

      toast({
        title: "Export successful",
        description: `Data exported as ${extension.toUpperCase()}`,
      })
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const copySQL = () => {
    navigator.clipboard.writeText(shareableSQL)
    toast({
      title: "Copied to clipboard",
      description: "SQL query copied",
    })
  }

  const toggleColumn = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== columnName))
    } else {
      setSelectedColumns([...selectedColumns, columnName])
    }
  }

  const selectAllColumns = () => {
    if (tableInfo) {
      setSelectedColumns(tableInfo.columns.map((c) => c.name))
    }
  }

  const deselectAllColumns = () => {
    setSelectedColumns([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>Configure your data export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tableInfo && (
            <>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{tableInfo.rowCount.toLocaleString()} rows</span>
                <span>{tableInfo.columns.length} columns</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Columns (optional)</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={selectAllColumns}>
                      Select All
                    </Button>
                    <Button size="sm" variant="ghost" onClick={deselectAllColumns}>
                      Clear
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {tableInfo.columns.map((column) => (
                      <div key={column.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${column.name}`}
                          checked={selectedColumns.includes(column.name)}
                          onCheckedChange={() => toggleColumn(column.name)}
                        />
                        <label htmlFor={`col-${column.name}`} className="flex-1 text-sm font-medium cursor-pointer">
                          {column.name}
                        </label>
                        <Badge variant="secondary" className="text-xs">
                          {column.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedColumns.length === 0 && (
                  <p className="text-xs text-muted-foreground">All columns will be exported</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>WHERE Clause (optional)</Label>
                <Textarea
                  value={whereClause}
                  onChange={(e) => setWhereClause(e.target.value)}
                  placeholder="column_name > 100 AND other_column = 'value'"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Filter rows using SQL WHERE conditions</p>
              </div>

              <div className="space-y-2">
                <Label>Limit Rows (optional)</Label>
                <Input
                  type="number"
                  value={limit || ""}
                  onChange={(e) => setLimit(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                  placeholder="Leave empty for all rows"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedTable && (
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="share">
              <Share2 className="mr-2 h-4 w-4" />
              Share Query
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Formats</CardTitle>
                <CardDescription>Choose your preferred export format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleExport("csv")}
                  disabled={isExporting || !connection}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>

                <Button
                  onClick={() => handleExport("json")}
                  disabled={isExporting || !connection}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </Button>

                <Button
                  onClick={() => handleExport("parquet")}
                  disabled={isExporting || !connection}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Export as Parquet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shareable SQL Query</CardTitle>
                <CardDescription>Copy this query to share with others</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea value={shareableSQL} readOnly className="font-mono text-sm min-h-[150px]" />
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copySQL}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>This query can be used in the Query Builder or any SQL client with DuckDB</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
