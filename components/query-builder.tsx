"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Save, History, BookOpen, Download, Trash2, Clock, CheckCircle2, XCircle, Copy } from "lucide-react"
import { queryStorage, queryTemplates, type SavedQuery, type QueryHistory } from "@/lib/query-storage"
import { useToast } from "@/hooks/use-toast"

interface QueryBuilderProps {
  connection: AsyncDuckDBConnection | null
}

interface QueryResult {
  columns: string[]
  rows: any[]
  rowCount: number
  executionTime: number
}

export function QueryBuilder({ connection }: QueryBuilderProps) {
  const [sql, setSql] = useState("SELECT * FROM parquet_data LIMIT 100")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [queryName, setQueryName] = useState("")
  const [queryDescription, setQueryDescription] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    setSavedQueries(queryStorage.getSavedQueries())
    setQueryHistory(queryStorage.getQueryHistory())
  }, [])

  const executeQuery = async () => {
    if (!connection || !sql.trim()) return

    setIsExecuting(true)
    setError(null)
    const startTime = performance.now()

    try {
      const result = await connection.query(sql)
      const executionTime = performance.now() - startTime

      const columns = result.schema.fields.map((f) => f.name)
      const rows = result.toArray().map((row) => {
        const obj: any = {}
        columns.forEach((col, i) => {
          const value = row[col]
          obj[col] = typeof value === "bigint" ? Number(value) : value
        })
        return obj
      })

      setResult({
        columns,
        rows,
        rowCount: rows.length,
        executionTime,
      })

      // Add to history
      queryStorage.addToHistory({
        sql,
        rowCount: rows.length,
        executionTime,
      })
      setQueryHistory(queryStorage.getQueryHistory())

      toast({
        title: "Query executed successfully",
        description: `Returned ${rows.length} rows in ${executionTime.toFixed(2)}ms`,
      })
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error"
      setError(errorMessage)

      queryStorage.addToHistory({
        sql,
        error: errorMessage,
      })
      setQueryHistory(queryStorage.getQueryHistory())

      toast({
        title: "Query failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = () => {
    if (!queryName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your query",
        variant: "destructive",
      })
      return
    }

    queryStorage.saveQuery({
      name: queryName,
      sql,
      description: queryDescription,
    })

    setSavedQueries(queryStorage.getSavedQueries())
    setSaveDialogOpen(false)
    setQueryName("")
    setQueryDescription("")

    toast({
      title: "Query saved",
      description: `"${queryName}" has been saved to your library`,
    })
  }

  const loadQuery = (query: SavedQuery) => {
    setSql(query.sql)
    toast({
      title: "Query loaded",
      description: `Loaded "${query.name}"`,
    })
  }

  const deleteQuery = (id: string) => {
    queryStorage.deleteQuery(id)
    setSavedQueries(queryStorage.getSavedQueries())
    toast({
      title: "Query deleted",
      description: "Query has been removed from your library",
    })
  }

  const exportResults = (format: "csv" | "json") => {
    if (!result) return

    let content: string
    let mimeType: string
    let extension: string

    if (format === "csv") {
      const headers = result.columns.join(",")
      const rows = result.rows.map((row) => result.columns.map((col) => JSON.stringify(row[col] ?? "")).join(","))
      content = [headers, ...rows].join("\n")
      mimeType = "text/csv"
      extension = "csv"
    } else {
      content = JSON.stringify(result.rows, null, 2)
      mimeType = "application/json"
      extension = "json"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `query-results-${Date.now()}.${extension}`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `Results exported as ${extension.toUpperCase()}`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "SQL query copied",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Editor</CardTitle>
          <CardDescription>Write and execute SQL queries against your parquet data using DuckDB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Enter your SQL query..."
              className="font-mono text-sm min-h-[200px]"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  executeQuery()
                }
              }}
            />
            <p className="text-xs text-muted-foreground">Press Cmd/Ctrl + Enter to execute</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={executeQuery} disabled={isExecuting || !connection}>
              <Play className="mr-2 h-4 w-4" />
              {isExecuting ? "Executing..." : "Execute Query"}
            </Button>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save Query
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Query</DialogTitle>
                  <DialogDescription>Save this query to your library for quick access later</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query-name">Name</Label>
                    <Input
                      id="query-name"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      placeholder="My Query"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="query-description">Description (optional)</Label>
                    <Textarea
                      id="query-description"
                      value={queryDescription}
                      onChange={(e) => setQueryDescription(e.target.value)}
                      placeholder="What does this query do?"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveQuery}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {result && (
              <>
                <Button variant="outline" onClick={() => exportResults("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => exportResults("json")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </>
            )}
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Query Error</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Query Results</CardTitle>
                    <CardDescription>
                      {result.rowCount} rows returned in {result.executionTime.toFixed(2)}ms
                    </CardDescription>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <div className="relative">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background border-b">
                        <tr>
                          {result.columns.map((col) => (
                            <th key={col} className="px-4 py-2 text-left font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="border-b">
                            {result.columns.map((col) => (
                              <td key={col} className="px-4 py-2">
                                {row[col]?.toString() ?? "NULL"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <BookOpen className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Save className="mr-2 h-4 w-4" />
            Saved ({savedQueries.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {queryTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(template.sql)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {template.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">{template.sql}</pre>
                  <Button className="w-full mt-3 bg-transparent" variant="outline" onClick={() => loadQuery(template)}>
                    Load Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {savedQueries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Save className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved queries yet</p>
                <p className="text-sm mt-1">Save your queries for quick access later</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedQueries.map((query) => (
                <Card key={query.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{query.name}</CardTitle>
                        {query.description && <CardDescription className="mt-1">{query.description}</CardDescription>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(query.sql)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteQuery(query.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto mb-3">{query.sql}</pre>
                    <Button className="w-full bg-transparent" variant="outline" onClick={() => loadQuery(query)}>
                      Load Query
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {queryHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No query history yet</p>
                <p className="text-sm mt-1">Your executed queries will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryStorage.clearHistory()
                    setQueryHistory([])
                    toast({
                      title: "History cleared",
                      description: "Query history has been cleared",
                    })
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </div>
              <div className="space-y-2">
                {queryHistory.map((entry) => (
                  <Card key={entry.id} className={entry.error ? "border-destructive" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {entry.error ? (
                          <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto mb-2">{entry.sql}</pre>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(entry.executedAt).toLocaleString()}
                            </span>
                            {entry.rowCount !== undefined && <span>{entry.rowCount} rows</span>}
                            {entry.executionTime !== undefined && <span>{entry.executionTime.toFixed(2)}ms</span>}
                          </div>
                          {entry.error && <p className="text-xs text-destructive mt-2">{entry.error}</p>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setSql(entry.sql)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
