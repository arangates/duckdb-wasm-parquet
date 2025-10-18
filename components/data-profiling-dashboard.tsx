"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { profileData, type DataProfile, type ColumnProfile } from "@/lib/data-profiling"
import { Database, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Hash, Calendar, Type } from "lucide-react"

interface DataProfilingDashboardProps {
  connection: AsyncDuckDBConnection | null
}

export function DataProfilingDashboard({ connection }: DataProfilingDashboardProps) {
  const [profile, setProfile] = useState<DataProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<ColumnProfile | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!connection) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await profileData(connection)
        setProfile(data)
        if (data.columns.length > 0) {
          setSelectedColumn(data.columns[0])
        }
      } catch (err: any) {
        console.error("[v0] Error profiling data:", err)
        setError(err.message || "Failed to profile data")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [connection])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Profiling data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getTypeIcon = (type: string) => {
    if (type.includes("INT") || type.includes("DOUBLE") || type.includes("DECIMAL")) {
      return <Hash className="h-4 w-4" />
    }
    if (type.includes("DATE") || type.includes("TIME")) {
      return <Calendar className="h-4 w-4" />
    }
    return <Type className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalRows.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{profile.totalColumns} columns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getQualityColor(profile.dataQualityScore)}`}>
              {profile.dataQualityScore}%
            </div>
            <Progress value={profile.dataQualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completeness</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.completeness.toFixed(1)}%</div>
            <Progress value={profile.completeness} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Columns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalColumns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.columns.filter((c) => c.nullPercentage === 0).length} complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Column Details */}
      <Card>
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
          <CardDescription>Detailed statistics and quality metrics for each column</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed View</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {profile.columns.map((column) => (
                    <Card
                      key={column.name}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedColumn(column)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(column.type)}
                            <div>
                              <CardTitle className="text-base">{column.name}</CardTitle>
                              <CardDescription className="mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {column.type}
                                </Badge>
                              </CardDescription>
                            </div>
                          </div>
                          {column.nullPercentage === 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : column.nullPercentage > 50 ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Unique Values</p>
                            <p className="font-medium">{column.uniqueCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Null Count</p>
                            <p className="font-medium">{column.nullCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completeness</p>
                            <p className="font-medium">{(100 - column.nullPercentage).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cardinality</p>
                            <p className="font-medium">{column.cardinality.toFixed(3)}</p>
                          </div>
                        </div>

                        {column.nullPercentage > 0 && (
                          <div className="mt-4">
                            <Progress value={100 - column.nullPercentage} />
                          </div>
                        )}

                        {(column.min !== undefined || column.avg !== undefined) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t">
                            {column.min !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Min</p>
                                <p className="font-medium">{column.min?.toString()}</p>
                              </div>
                            )}
                            {column.max !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Max</p>
                                <p className="font-medium">{column.max?.toString()}</p>
                              </div>
                            )}
                            {column.avg !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Average</p>
                                <p className="font-medium">{column.avg.toFixed(2)}</p>
                              </div>
                            )}
                            {column.stdDev !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Std Dev</p>
                                <p className="font-medium">{column.stdDev.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Unique</TableHead>
                      <TableHead className="text-right">Nulls</TableHead>
                      <TableHead className="text-right">Complete</TableHead>
                      <TableHead className="text-right">Cardinality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.columns.map((column) => (
                      <TableRow key={column.name} className="cursor-pointer" onClick={() => setSelectedColumn(column)}>
                        <TableCell className="font-medium">{column.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {column.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{column.uniqueCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{column.nullCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(100 - column.nullPercentage).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{column.cardinality.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Column Details */}
      {selectedColumn && selectedColumn.topValues && (
        <Card>
          <CardHeader>
            <CardTitle>Top Values: {selectedColumn.name}</CardTitle>
            <CardDescription>Most frequent values in this column</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedColumn.topValues.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.value?.toString() || "NULL"}</TableCell>
                    <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
