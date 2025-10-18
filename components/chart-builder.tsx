"use client"

import { useState, useEffect } from "react"
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { visualizationBuilder, type ChartConfig, type ChartData, type ChartType } from "@/lib/visualization-builder"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, LineChart, AreaChart, ScatterChart, PieChart, Play } from "lucide-react"
import { Bar, Line, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface ChartBuilderProps {
  connection: AsyncDuckDBConnection | null
}

export function ChartBuilder({ connection }: ChartBuilderProps) {
  const [tables, setTables] = useState<string[]>([])
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([])
  const [config, setConfig] = useState<Partial<ChartConfig>>({
    type: "bar",
    limit: 20,
    orderBy: "DESC",
    aggregation: "SUM",
  })
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (connection) {
      loadTables()
    }
  }, [connection])

  useEffect(() => {
    if (connection && config.tableName) {
      loadColumns(config.tableName)
    }
  }, [connection, config.tableName])

  const loadTables = async () => {
    if (!connection) return
    try {
      const tableList = await visualizationBuilder.getAvailableTables(connection)
      setTables(tableList)
    } catch (error) {
      console.error("[v0] Error loading tables:", error)
    }
  }

  const loadColumns = async (tableName: string) => {
    if (!connection) return
    try {
      const cols = await visualizationBuilder.getTableColumns(connection, tableName)
      setColumns(cols)
    } catch (error) {
      console.error("[v0] Error loading columns:", error)
    }
  }

  const generateChart = async () => {
    if (!connection || !config.tableName || !config.xColumn || !config.yColumn) {
      toast({
        title: "Invalid configuration",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const fullConfig: ChartConfig = {
        id: crypto.randomUUID(),
        name: config.name || "Untitled Chart",
        type: config.type as ChartType,
        tableName: config.tableName,
        xColumn: config.xColumn,
        yColumn: config.yColumn,
        groupByColumn: config.groupByColumn,
        aggregation: config.aggregation,
        limit: config.limit,
        orderBy: config.orderBy,
      }

      const data = await visualizationBuilder.generateChartData(connection, fullConfig)
      setChartData(data)

      toast({
        title: "Chart generated",
        description: `Created ${config.type} chart with ${data.labels.length} data points`,
      })
    } catch (error: any) {
      toast({
        title: "Error generating chart",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case "bar":
        return <BarChart3 className="h-4 w-4" />
      case "line":
        return <LineChart className="h-4 w-4" />
      case "area":
        return <AreaChart className="h-4 w-4" />
      case "scatter":
        return <ScatterChart className="h-4 w-4" />
      case "pie":
        return <PieChart className="h-4 w-4" />
    }
  }

  const renderChart = () => {
    if (!chartData) return null

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: config.name || "Chart",
        },
      },
    }

    const chartDataConfig = {
      labels: chartData.labels,
      datasets: chartData.datasets.map((dataset, i) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`,
        borderColor: `hsl(var(--chart-${(i % 5) + 1}))`,
        borderWidth: 2,
      })),
    }

    switch (config.type) {
      case "bar":
        return <Bar options={chartOptions} data={chartDataConfig} />
      case "line":
      case "area":
        return (
          <Line
            options={{
              ...chartOptions,
              elements: {
                line: {
                  tension: 0.4,
                },
              },
            }}
            data={{
              ...chartDataConfig,
              datasets: chartDataConfig.datasets.map((ds) => ({
                ...ds,
                fill: config.type === "area",
              })),
            }}
          />
        )
      case "pie":
        return <Pie options={chartOptions} data={chartDataConfig} />
      default:
        return <Bar options={chartOptions} data={chartDataConfig} />
    }
  }

  const numericColumns = columns.filter((col) => visualizationBuilder.isNumericColumn(col.type))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chart Configuration</CardTitle>
          <CardDescription>Configure your visualization settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Chart Name</Label>
              <Input
                value={config.name || ""}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="My Chart"
              />
            </div>

            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select value={config.type} onValueChange={(value: ChartType) => setConfig({ ...config, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="area">
                    <div className="flex items-center gap-2">
                      <AreaChart className="h-4 w-4" />
                      Area Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Pie Chart
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Table</Label>
              <Select value={config.tableName} onValueChange={(value) => setConfig({ ...config, tableName: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
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

            <div className="space-y-2">
              <Label>X-Axis Column</Label>
              <Select
                value={config.xColumn}
                onValueChange={(value) => setConfig({ ...config, xColumn: value })}
                disabled={!config.tableName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{col.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {col.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Y-Axis Column (Numeric)</Label>
              <Select
                value={config.yColumn}
                onValueChange={(value) => setConfig({ ...config, yColumn: value })}
                disabled={!config.tableName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{col.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {col.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aggregation</Label>
              <Select
                value={config.aggregation}
                onValueChange={(value: any) => setConfig({ ...config, aggregation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUM">Sum</SelectItem>
                  <SelectItem value="AVG">Average</SelectItem>
                  <SelectItem value="COUNT">Count</SelectItem>
                  <SelectItem value="MIN">Minimum</SelectItem>
                  <SelectItem value="MAX">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Limit</Label>
              <Input
                type="number"
                value={config.limit || ""}
                onChange={(e) => setConfig({ ...config, limit: Number.parseInt(e.target.value) || undefined })}
                placeholder="20"
              />
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Select value={config.orderBy} onValueChange={(value: any) => setConfig({ ...config, orderBy: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">Ascending</SelectItem>
                  <SelectItem value="DESC">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateChart} disabled={isGenerating || !connection} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Chart"}
          </Button>
        </CardContent>
      </Card>

      {chartData && (
        <Card>
          <CardHeader>
            <CardTitle>{config.name || "Chart"}</CardTitle>
            <CardDescription>
              {chartData.labels.length} data points • {config.type} chart
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">{renderChart()}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
