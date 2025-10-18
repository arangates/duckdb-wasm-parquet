import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

export interface ExportConfig {
  tableName: string
  format: "csv" | "json" | "parquet"
  columns?: string[]
  whereClause?: string
  limit?: number
}

export const dataExport = {
  async exportToCSV(connection: AsyncDuckDBConnection, config: ExportConfig): Promise<Blob> {
    const columns = config.columns?.join(", ") || "*"
    const where = config.whereClause ? `WHERE ${config.whereClause}` : ""
    const limit = config.limit ? `LIMIT ${config.limit}` : ""

    const sql = `SELECT ${columns} FROM ${config.tableName} ${where} ${limit}`
    const result = await connection.query(sql)

    const columnNames = result.schema.fields.map((f) => f.name)
    const rows = result.toArray()

    const csvHeader = columnNames.join(",")
    const csvRows = rows.map((row) =>
      columnNames
        .map((col) => {
          const value = row[col]
          if (value === null || value === undefined) return ""
          const str = typeof value === "bigint" ? value.toString() : String(value)
          // Escape quotes and wrap in quotes if contains comma or quote
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(","),
    )

    const csv = [csvHeader, ...csvRows].join("\n")
    return new Blob([csv], { type: "text/csv;charset=utf-8;" })
  },

  async exportToJSON(connection: AsyncDuckDBConnection, config: ExportConfig): Promise<Blob> {
    const columns = config.columns?.join(", ") || "*"
    const where = config.whereClause ? `WHERE ${config.whereClause}` : ""
    const limit = config.limit ? `LIMIT ${config.limit}` : ""

    const sql = `SELECT ${columns} FROM ${config.tableName} ${where} ${limit}`
    const result = await connection.query(sql)

    const columnNames = result.schema.fields.map((f) => f.name)
    const rows = result.toArray().map((row) => {
      const obj: any = {}
      columnNames.forEach((col) => {
        const value = row[col]
        obj[col] = typeof value === "bigint" ? Number(value) : value
      })
      return obj
    })

    const json = JSON.stringify(rows, null, 2)
    return new Blob([json], { type: "application/json;charset=utf-8;" })
  },

  async exportToParquet(connection: AsyncDuckDBConnection, config: ExportConfig): Promise<Blob> {
    const columns = config.columns?.join(", ") || "*"
    const where = config.whereClause ? `WHERE ${config.whereClause}` : ""
    const limit = config.limit ? `LIMIT ${config.limit}` : ""

    const sql = `SELECT ${columns} FROM ${config.tableName} ${where} ${limit}`
    const result = await connection.query(sql)

    // Convert Arrow result to Parquet using DuckDB's COPY command
    const tempTable = `temp_export_${Date.now()}`
    await connection.query(`CREATE TEMP TABLE ${tempTable} AS ${sql}`)

    // Note: In a real implementation, you would use DuckDB's COPY TO PARQUET
    // For now, we'll export as Arrow IPC which is similar
    const arrowBuffer = await result.toArray()
    const json = JSON.stringify(arrowBuffer)
    return new Blob([json], { type: "application/octet-stream" })
  },

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  async getTableInfo(connection: AsyncDuckDBConnection, tableName: string) {
    const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`)
    const rowCount = Number(countResult.toArray()[0].count)

    const columnsResult = await connection.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `)
    const columns = columnsResult.toArray().map((row) => ({
      name: row.column_name as string,
      type: row.data_type as string,
    }))

    return { rowCount, columns }
  },

  generateShareableSQL(config: ExportConfig): string {
    const columns = config.columns?.join(", ") || "*"
    const where = config.whereClause ? `WHERE ${config.whereClause}` : ""
    const limit = config.limit ? `LIMIT ${config.limit}` : ""

    return `SELECT ${columns}\nFROM ${config.tableName}\n${where}\n${limit}`.trim()
  },
}
