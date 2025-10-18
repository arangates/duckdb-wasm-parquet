"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fileStorage, type StoredFile } from "@/lib/file-storage"
import { multiFileManager, type LoadedTable, type JoinConfig, type UnionConfig } from "@/lib/multi-file-manager"
import { useToast } from "@/hooks/use-toast"
import { Upload, Link2, Layers, Trash2, Eye, Database, CheckCircle2 } from "lucide-react"

interface MultiFileAnalysisProps {
  connection: AsyncDuckDBConnection | null
}

export function MultiFileAnalysis({ connection }: MultiFileAnalysisProps) {
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([])
  const [loadedTables, setLoadedTables] = useState<LoadedTable[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [previewTableName, setPreviewTableName] = useState<string | null>(null)
  const { toast } = useToast()

  // Join configuration
  const [joinConfig, setJoinConfig] = useState<JoinConfig>({
    leftTable: "",
    rightTable: "",
    joinType: "INNER",
    leftColumn: "",
    rightColumn: "",
  })
  const [joinResultName, setJoinResultName] = useState("joined_data")

  // Union configuration
  const [unionConfig, setUnionConfig] = useState<UnionConfig>({
    tables: [],
    unionType: "UNION",
  })
  const [unionResultName, setUnionResultName] = useState("union_data")

  useEffect(() => {
    loadStoredFiles()
  }, [])

  const loadStoredFiles = async () => {
    const files = await fileStorage.getAllFiles()
    setStoredFiles(files)
  }

  const loadFileAsTable = async (file: StoredFile) => {
    if (!connection) return

    setIsLoading(true)
    try {
      const tableName = `file_${file.id.replace(/-/g, "_")}`
      const table = await multiFileManager.loadFileAsTable(connection, file, tableName)
      setLoadedTables([...loadedTables, table])
      toast({
        title: "File loaded",
        description: `${file.name} loaded as table ${tableName}`,
      })
    } catch (error: any) {
      toast({
        title: "Error loading file",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unloadTable = async (table: LoadedTable) => {
    if (!connection) return

    try {
      await multiFileManager.dropTable(connection, table.tableName)
      setLoadedTables(loadedTables.filter((t) => t.id !== table.id))
      toast({
        title: "Table unloaded",
        description: `${table.name} has been unloaded`,
      })
    } catch (error: any) {
      toast({
        title: "Error unloading table",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const previewTableData = async (tableName: string) => {
    if (!connection) return

    try {
      const data = await multiFileManager.getTablePreview(connection, tableName)
      setPreviewData(data)
      setPreviewTableName(tableName)
    } catch (error: any) {
      toast({
        title: "Error loading preview",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const executeJoin = async () => {
    if (!connection) return

    if (!joinConfig.leftTable || !joinConfig.rightTable || !joinConfig.leftColumn || !joinConfig.rightColumn) {
      toast({
        title: "Invalid configuration",
        description: "Please fill in all join fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const rowCount = await multiFileManager.joinTables(connection, joinConfig, joinResultName)
      toast({
        title: "Join successful",
        description: `Created table ${joinResultName} with ${rowCount} rows`,
      })

      // Reload tables to include the new joined table
      const table = loadedTables.find((t) => t.tableName === joinConfig.leftTable)
      if (table) {
        const newTable: LoadedTable = {
          id: `join_${Date.now()}`,
          name: joinResultName,
          tableName: joinResultName,
          rowCount,
          columnCount: 0,
          columns: [],
          loadedAt: Date.now(),
        }
        setLoadedTables([...loadedTables, newTable])
      }
    } catch (error: any) {
      toast({
        title: "Join failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeUnion = async () => {
    if (!connection) return

    if (unionConfig.tables.length < 2) {
      toast({
        title: "Invalid configuration",
        description: "Please select at least 2 tables to union",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const rowCount = await multiFileManager.unionTables(connection, unionConfig, unionResultName)
      toast({
        title: "Union successful",
        description: `Created table ${unionResultName} with ${rowCount} rows`,
      })

      const newTable: LoadedTable = {
        id: `union_${Date.now()}`,
        name: unionResultName,
        tableName: unionResultName,
        rowCount,
        columnCount: 0,
        columns: [],
        loadedAt: Date.now(),
      }
      setLoadedTables([...loadedTables, newTable])
    } catch (error: any) {
      toast({
        title: "Union failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTableColumns = (tableName: string): string[] => {
    const table = loadedTables.find((t) => t.tableName === tableName)
    return table?.columns.map((c) => c.name) || []
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Available Files */}
        <Card>
          <CardHeader>
            <CardTitle>Available Files</CardTitle>
            <CardDescription>Load parquet files from storage into DuckDB tables</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {storedFiles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files in storage</p>
                  <p className="text-sm mt-1">Upload files from the Parquet Viewer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {storedFiles.map((file) => {
                    const isLoaded = loadedTables.some((t) => t.id === file.id)
                    return (
                      <Card key={file.id} className={isLoaded ? "border-primary" : ""}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 flex-shrink-0" />
                                <p className="font-medium truncate">{file.name}</p>
                                {isLoaded && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={isLoaded ? "outline" : "default"}
                              onClick={() => loadFileAsTable(file)}
                              disabled={isLoaded || isLoading}
                            >
                              {isLoaded ? "Loaded" : "Load"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Loaded Tables */}
        <Card>
          <CardHeader>
            <CardTitle>Loaded Tables</CardTitle>
            <CardDescription>Tables currently available for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loadedTables.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tables loaded</p>
                  <p className="text-sm mt-1">Load files to start analyzing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {loadedTables.map((table) => (
                    <Card key={table.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{table.tableName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {table.rowCount.toLocaleString()} rows
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {table.columnCount} cols
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => previewTableData(table.tableName)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => unloadTable(table)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Operations */}
      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="join">
            <Link2 className="mr-2 h-4 w-4" />
            Join Tables
          </TabsTrigger>
          <TabsTrigger value="union">
            <Layers className="mr-2 h-4 w-4" />
            Union Tables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Join Configuration</CardTitle>
              <CardDescription>Combine two tables based on a common column</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Left Table</Label>
                  <Select
                    value={joinConfig.leftTable}
                    onValueChange={(value) => setJoinConfig({ ...joinConfig, leftTable: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadedTables.map((table) => (
                        <SelectItem key={table.id} value={table.tableName}>
                          {table.tableName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Right Table</Label>
                  <Select
                    value={joinConfig.rightTable}
                    onValueChange={(value) => setJoinConfig({ ...joinConfig, rightTable: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadedTables.map((table) => (
                        <SelectItem key={table.id} value={table.tableName}>
                          {table.tableName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Left Column</Label>
                  <Select
                    value={joinConfig.leftColumn}
                    onValueChange={(value) => setJoinConfig({ ...joinConfig, leftColumn: value })}
                    disabled={!joinConfig.leftTable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTableColumns(joinConfig.leftTable).map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Right Column</Label>
                  <Select
                    value={joinConfig.rightColumn}
                    onValueChange={(value) => setJoinConfig({ ...joinConfig, rightColumn: value })}
                    disabled={!joinConfig.rightTable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTableColumns(joinConfig.rightTable).map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Join Type</Label>
                  <Select
                    value={joinConfig.joinType}
                    onValueChange={(value: any) => setJoinConfig({ ...joinConfig, joinType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INNER">Inner Join</SelectItem>
                      <SelectItem value="LEFT">Left Join</SelectItem>
                      <SelectItem value="RIGHT">Right Join</SelectItem>
                      <SelectItem value="FULL">Full Outer Join</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Result Table Name</Label>
                  <Input
                    value={joinResultName}
                    onChange={(e) => setJoinResultName(e.target.value)}
                    placeholder="joined_data"
                  />
                </div>
              </div>

              <Button onClick={executeJoin} disabled={isLoading || !connection} className="w-full">
                <Link2 className="mr-2 h-4 w-4" />
                Execute Join
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="union" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Union Configuration</CardTitle>
              <CardDescription>Combine multiple tables vertically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Tables (minimum 2)</Label>
                <div className="space-y-2">
                  {loadedTables.map((table) => (
                    <div key={table.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`union-${table.id}`}
                        checked={unionConfig.tables.includes(table.tableName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnionConfig({
                              ...unionConfig,
                              tables: [...unionConfig.tables, table.tableName],
                            })
                          } else {
                            setUnionConfig({
                              ...unionConfig,
                              tables: unionConfig.tables.filter((t) => t !== table.tableName),
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`union-${table.id}`} className="text-sm font-medium">
                        {table.tableName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Union Type</Label>
                  <Select
                    value={unionConfig.unionType}
                    onValueChange={(value: any) => setUnionConfig({ ...unionConfig, unionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNION">Union (Remove Duplicates)</SelectItem>
                      <SelectItem value="UNION ALL">Union All (Keep Duplicates)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Result Table Name</Label>
                  <Input
                    value={unionResultName}
                    onChange={(e) => setUnionResultName(e.target.value)}
                    placeholder="union_data"
                  />
                </div>
              </div>

              <Button onClick={executeUnion} disabled={isLoading || !connection} className="w-full">
                <Layers className="mr-2 h-4 w-4" />
                Execute Union
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {previewData && previewTableName && (
        <Card>
          <CardHeader>
            <CardTitle>Table Preview: {previewTableName}</CardTitle>
            <CardDescription>First 10 rows</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0] || {}).map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <TableCell key={j}>{val?.toString() || "NULL"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
