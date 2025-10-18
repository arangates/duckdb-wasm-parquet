"use client"

import * as React from "react"
import { IconTrash, IconFile, IconClock, IconDatabase } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllFiles, deleteFile, getFile } from "@/lib/file-storage"
import { formatDistanceToNow } from "date-fns"

interface FileManagerProps {
  onFileSelect: (file: File) => void
}

export function FileManager({ onFileSelect }: FileManagerProps) {
  const [files, setFiles] = React.useState<Array<{ id: string; name: string; size: number; uploadedAt: number }>>([])
  const [loading, setLoading] = React.useState(true)

  const loadFiles = React.useCallback(async () => {
    try {
      const storedFiles = await getAllFiles()
      setFiles(storedFiles)
    } catch (error) {
      console.error("[v0] Error loading files:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await deleteFile(id)
      await loadFiles()
    } catch (error) {
      console.error("[v0] Error deleting file:", error)
    }
  }

  const handleFileClick = async (id: string) => {
    try {
      const file = await getFile(id)
      if (file) {
        onFileSelect(file)
      }
    } catch (error) {
      console.error("[v0] Error loading file:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Loading your stored files...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>No files stored yet. Upload a file to get started.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Files</CardTitle>
        <CardDescription>Click on a file to load it, or delete to free up storage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => handleFileClick(file.id)}
              className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <IconDatabase className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <IconFile className="size-3" />
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="flex items-center gap-1">
                      <IconClock className="size-3" />
                      {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(file.id, e)}
                className="text-muted-foreground hover:text-destructive"
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
