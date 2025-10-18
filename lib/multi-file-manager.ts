import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"
import type { StoredFile } from "@/lib/file-storage"

export interface LoadedTable {
  id: string
  name: string
  tableName: string
  rowCount: number
  columnCount: number
  columns: Array<{ name: string; type: string }>
  loadedAt: number
}

export interface JoinConfig {
  leftTable: string
  rightTable: string
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL"
  leftColumn: string
  rightColumn: string
}

export interface UnionConfig {
  tables: string[]
  unionType: "UNION" | "UNION ALL"
}

export const multiFileManager = {
  async loadFileAsTable(connection: AsyncDuckDBConnection, file: StoredFile, tableName: string): Promise<LoadedTable> {
    // Register file in DuckDB
    await connection.insertArrowFromIPCStream(file.data, {
      name: tableName,
    })

    // Get table info
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

    return {
      id: file.id,
      name: file.name,
      tableName,
      rowCount,
      columnCount: columns.length,
      columns,
      loadedAt: Date.now(),
    }
  },

  async getLoadedTables(connection: AsyncDuckDBConnection): Promise<string[]> {
    const result = await connection.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'main'
      AND table_name != 'parquet_data'
      ORDER BY table_name
    `)
    return result.toArray().map((row) => row.table_name as string)
  },

  async joinTables(connection: AsyncDuckDBConnection, config: JoinConfig, resultTableName: string): Promise<number> {
    const sql = `
      CREATE OR REPLACE TABLE ${resultTableName} AS
      SELECT *
      FROM ${config.leftTable} AS l
      ${config.joinType} JOIN ${config.rightTable} AS r
      ON l.${config.leftColumn} = r.${config.rightColumn}
    `
    await connection.query(sql)

    const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${resultTableName}`)
    return Number(countResult.toArray()[0].count)
  },

  async unionTables(connection: AsyncDuckDBConnection, config: UnionConfig, resultTableName: string): Promise<number> {
    const unionClauses = config.tables.map((table) => `SELECT * FROM ${table}`).join(` ${config.unionType} `)
    const sql = `CREATE OR REPLACE TABLE ${resultTableName} AS ${unionClauses}`
    await connection.query(sql)

    const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${resultTableName}`)
    return Number(countResult.toArray()[0].count)
  },

  async dropTable(connection: AsyncDuckDBConnection, tableName: string): Promise<void> {
    await connection.query(`DROP TABLE IF EXISTS ${tableName}`)
  },

  async getTablePreview(connection: AsyncDuckDBConnection, tableName: string, limit = 10): Promise<any[]> {
    const result = await connection.query(`SELECT * FROM ${tableName} LIMIT ${limit}`)
    const columns = result.schema.fields.map((f) => f.name)
    return result.toArray().map((row) => {
      const obj: any = {}
      columns.forEach((col) => {
        const value = row[col]
        obj[col] = typeof value === "bigint" ? Number(value) : value
      })
      return obj
    })
  },
}
