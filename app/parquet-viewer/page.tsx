"use client"

import * as React from "react"
import { IconUpload, IconFileTypeCsv } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ParquetDataViewer } from "@/components/parquet-data-viewer"
import { FileManager } from "@/components/file-manager"
import { loadParquetFile } from "@/lib/duckdb-client"
import { saveFile } from "@/lib/file-storage"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

export default function ParquetViewerPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [connection, setConnection] = React.useState<AsyncDuckDBConnection | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileMetadata, setFileMetadata] = React.useState<{
    name: string
    size: number
    rowCount: number
  } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setLoading(true)
    setError(null)

    try {
      await saveFile(selectedFile)

      const conn = await loadParquetFile(selectedFile)
      setConnection(conn)

      const result = await conn.query("SELECT COUNT(*) as count FROM parquet_data")
      const rowCount = Number(result.toArray()[0].count)

      setFileMetadata({
        name: selectedFile.name,
        size: selectedFile.size,
        rowCount,
      })
    } catch (err) {
      console.error("[v0] Error loading parquet file:", err)
      setError("Failed to load Parquet file. Please ensure it is a valid Parquet file.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    await processFile(selectedFile)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith(".parquet")) {
      processFile(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleStoredFileSelect = async (storedFile: File) => {
    await processFile(storedFile)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {!connection ? (
        <>
          <Card className="border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Parquet File Viewer</CardTitle>
              <CardDescription className="text-base">
                Upload and analyze Parquet files with SQL-powered data exploration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border/50 rounded-lg p-16 text-center hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors">
                    <IconFileTypeCsv className="size-12 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2 max-w-md">
                    <p className="text-xl font-semibold">
                      {loading ? "Processing file..." : "Drop your Parquet file here"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse • Supports all compression formats
                    </p>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-md">
                      <IconFileTypeCsv className="size-4" />
                      <span>{file.name}</span>
                      <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">{error}</div>
                  )}
                  <Button size="lg" disabled={loading} className="mt-2">
                    <IconUpload />
                    Select Parquet File
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

          <FileManager onFileSelect={handleStoredFileSelect} />
        </>
      ) : (
        <ParquetDataViewer
          connection={connection}
          fileMetadata={fileMetadata}
          onReset={() => {
            setConnection(null)
            setFileMetadata(null)
            setFile(null)
          }}
        />
      )}
    </div>
  )
}
