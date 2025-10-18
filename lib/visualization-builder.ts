import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

export type ChartType = "bar" | "line" | "area" | "scatter" | "pie"

export interface ChartConfig {
  id: string
  name: string
  type: ChartType
  tableName: string
  xColumn: string
  yColumn: string
  groupByColumn?: string
  aggregation?: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX"
  limit?: number
  orderBy?: "ASC" | "DESC"
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
}

export const visualizationBuilder = {
  async generateChartData(connection: AsyncDuckDBConnection, config: ChartConfig): Promise<ChartData> {
    let sql: string

    if (config.aggregation) {
      // Aggregated query
      const aggFunc = config.aggregation
      const groupBy = config.groupByColumn || config.xColumn

      sql = `
        SELECT 
          ${groupBy} as x_value,
          ${aggFunc}(${config.yColumn}) as y_value
        FROM ${config.tableName}
        WHERE ${groupBy} IS NOT NULL AND ${config.yColumn} IS NOT NULL
        GROUP BY ${groupBy}
        ORDER BY ${config.orderBy === "DESC" ? "y_value DESC" : "y_value ASC"}
        ${config.limit ? `LIMIT ${config.limit}` : ""}
      `
    } else {
      // Direct query
      sql = `
        SELECT 
          ${config.xColumn} as x_value,
          ${config.yColumn} as y_value
        FROM ${config.tableName}
        WHERE ${config.xColumn} IS NOT NULL AND ${config.yColumn} IS NOT NULL
        ORDER BY ${config.xColumn}
        ${config.limit ? `LIMIT ${config.limit}` : ""}
      `
    }

    const result = await connection.query(sql)
    const rows = result.toArray()

    const labels = rows.map((row) => {
      const val = row.x_value
      if (val instanceof Date) return val.toLocaleDateString()
      return String(val)
    })

    const data = rows.map((row) => {
      const val = row.y_value
      return typeof val === "bigint" ? Number(val) : Number(val)
    })

    return {
      labels,
      datasets: [
        {
          label: config.yColumn,
          data,
        },
      ],
    }
  },

  async getAvailableTables(connection: AsyncDuckDBConnection): Promise<string[]> {
    const result = await connection.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'main'
      ORDER BY table_name
    `)
    return result.toArray().map((row) => row.table_name as string)
  },

  async getTableColumns(
    connection: AsyncDuckDBConnection,
    tableName: string,
  ): Promise<Array<{ name: string; type: string }>> {
    const result = await connection.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `)
    return result.toArray().map((row) => ({
      name: row.column_name as string,
      type: row.data_type as string,
    }))
  },

  isNumericColumn(type: string): boolean {
    return (
      type.includes("INT") ||
      type.includes("DOUBLE") ||
      type.includes("DECIMAL") ||
      type.includes("FLOAT") ||
      type.includes("NUMERIC")
    )
  },
}
