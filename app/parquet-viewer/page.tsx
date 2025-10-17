"use client"

import * as React from "react"
import { IconUpload, IconFileTypeCsv } from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ParquetDataViewer } from "@/components/parquet-data-viewer"
import { loadParquetFile } from "@/lib/duckdb-client"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

export default function ParquetViewerPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [connection, setConnection] = React.useState<AsyncDuckDBConnection | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Loading parquet file with DuckDB...")
      const conn = await loadParquetFile(selectedFile)
      setConnection(conn)
      console.log("[v0] Parquet file loaded successfully")
    } catch (err) {
      console.error("[v0] Error loading parquet file:", err)
      setError("Failed to load Parquet file. Please ensure it is a valid Parquet file.")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith(".parquet")) {
      const input = fileInputRef.current
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(droppedFile)
        input.files = dataTransfer.files
        handleFileSelect({ target: input } as any)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {!connection ? (
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Parquet File</CardTitle>
                      <CardDescription>
                        Upload a Parquet file to visualize and analyze your data with SQL queries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="rounded-full bg-primary/10 p-4">
                            <IconFileTypeCsv className="size-8 text-primary" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <p className="text-lg font-medium">
                              {loading ? "Processing file..." : "Drop your Parquet file here"}
                            </p>
                            <p className="text-sm text-muted-foreground">or click to browse</p>
                          </div>
                          {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
                          {error && <p className="text-sm text-destructive">{error}</p>}
                          <Button disabled={loading}>
                            <IconUpload />
                            Select File
                          </Button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".parquet"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <ParquetDataViewer connection={connection} onReset={() => setConnection(null)} />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
